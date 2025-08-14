const { connectMongo, Session, Message } = require('./db');
const { ensureSchema, upsert, findSimilarQuestions } = require('./vector');
// 질문 생성은 기존대로 (Dify/에이전트 등 내부 구현 유지)
const { askAgentByRole, askOpenAIQuickSummary } = require('./ai');

/* ===================== ENV / CONST ===================== */
// .env에서 rounds/ROUNDS 모두 허용, 숫자 아님/음수면 기본값(5) 사용
const _roundsRaw = (process.env.ROUNDS ?? process.env.round ?? 5);
const ROUNDS = Math.max(0, Number(_roundsRaw)) || 5;

const SIM_THRESHOLD = Number(process.env.SIM_THRESHOLD || 0.86);

const ROLES = ['A', 'B', 'C'];
const MAX_TRANSCRIPT_FOR_SUMMARY = 6000;

/* ===================== UTILS ===================== */
const pickNext = (prev) => {
  const pool = ROLES.filter((r) => r !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
};

async function getSessionMessages(sessionId) {
  await connectMongo();
  return Message.find({ sessionId }).sort({ createdAt: 1 });
}

function toTranscript(messages) {
  return messages
    .map((m) => {
      const who = m.speaker === 'interviewer' ? `Q(${m.interviewerRole || ''})` : 'A';
      return `${who}: ${m.text}`;
    })
    .join('\n');
}

/* ===================== 짧은 분석(요약) ===================== */
/**
 * 면접 종료 후 큰 모달에서 보여줄 "짧은 분석" 생성
 * 반환: { summary: string, bullets: string[] }
 * 저장은 하지 않음(요청마다 새로 생성)
 */
async function generateQuickSummary(sessionId) {
  const msgs = await getSessionMessages(sessionId);
  if (!msgs.length) return { summary: '', bullets: [] };

  const transcript = toTranscript(msgs).slice(-MAX_TRANSCRIPT_FOR_SUMMARY);

  try {
    // OpenAI 직접 호출 (services/ai.js의 askOpenAIQuickSummary)
    return await askOpenAIQuickSummary({ transcript });
  } catch (e) {
    console.error('[generateQuickSummary] OpenAI error:', e?.message || e);
    return { summary: '요약을 생성하지 못했습니다.', bullets: [] };
  }
}

/* ===================== 세션 / 질문 흐름 ===================== */
async function startSession({ userName, userId, jobRole }) {
  await connectMongo();
  await ensureSchema();
  const s = await Session.create({
    userName,
    userId,
    jobRole,
    status: 'ongoing',
  });
  return { sessionId: s._id, displayName: userName };
}

async function handleUserAnswer({
  sessionId,
  userName,
  userId,
  jobRole,
  turn,
  userAnswer,
}) {
  await connectMongo();
  await ensureSchema();

  // 1) 사용자 답변 저장 + 업서트(실패해도 전체 흐름 유지)
  let a;
  try {
    a = await Message.create({
      sessionId,
      userName,
      userId,
      speaker: 'user',
      turn,
      text: userAnswer,
    });
    try {
      await upsert('AnswerChunk', {
        text: userAnswer,
        sessionId: String(sessionId),
        userName,
        userId,
        jobRole,
        turn,
        mongoMessageId: String(a._id),
      });
    } catch (e) {
      console.warn('[upsert AnswerChunk] skip:', e.message);
    }
  } catch (e) {
    console.warn('[Message.create user] failed:', e.message);
  }

  // 2) 중복질문 회피 힌트(실패해도 진행)
  let hints = [];
  try {
    const similar = await findSimilarQuestions({
      text: userAnswer,
      sessionId,
      userName,
      jobRole,
      limit: 5,
    });
    hints = (similar || [])
      .filter((s) => s.similarity >= SIM_THRESHOLD)
      .map((s) => s.text)
      .slice(0, 3);
  } catch (e) {
    console.warn('[findSimilarQuestions] skip:', e.message);
  }

  // 3) 다음 면접관 선택 + 질문 생성(실패 시 대체 질문)
  const lastQ = await Message.findOne({
    sessionId,
    speaker: 'interviewer',
  }).sort({ createdAt: -1 });
  const role = pickNext(lastQ?.interviewerRole);

  let nextQuestion = '';
  try {
    nextQuestion = await askAgentByRole(role, {
      input: userAnswer,
      variables: { userName, jobRole, avoid: hints },
    });
  } catch (e) {
    console.warn('[askAgentByRole] fallback:', e.message);
    nextQuestion = '조금 더 자세히 설명해 주실 수 있을까요?';
  }

  // 4) 질문 저장 + 업서트(실패해도 isEnd 계산은 가능)
  try {
    const q = await Message.create({
      sessionId,
      userName,
      userId,
      speaker: 'interviewer',
      interviewerRole: role,
      turn: turn + 1,
      text: nextQuestion,
    });
    try {
      await upsert('QuestionChunk', {
        text: nextQuestion,
        sessionId: String(sessionId),
        userName,
        userId,
        jobRole,
        turn: turn + 1,
        mongoMessageId: String(q._id),
        interviewerRole: role,
      });
    } catch (e) {
      console.warn('[upsert QuestionChunk] skip:', e.message);
    }
  } catch (e) {
    console.warn('[Message.create interviewer] failed:', e.message);
  }

  // 5) 종료 판정(면접관 질문 수 기준)
  let asked = 0;
  try {
    asked = await Message.countDocuments({
      sessionId,
      speaker: 'interviewer',
    });
  } catch (e) {
    console.warn('[countDocuments interviewer] fail:', e.message);
  }

  return {
    nextQuestion,
    role,
    isEnd: asked >= ROUNDS,
    similarUsed: hints,
  };
}

async function finishSession(sessionId) {
  await connectMongo();
  await Session.findByIdAndUpdate(sessionId, {
    status: 'ended',
    endedAt: new Date(),
  });
}

module.exports = {
  startSession,
  handleUserAnswer,
  finishSession,
  generateQuickSummary,
};
