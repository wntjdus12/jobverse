const { connectMongo, Session, Message, Report } = require('./db');
const { ensureSchema, upsert, findSimilarQuestions } = require('./vector');
const { askAgentByRole, askDifyApp } = require('./ai');

const ROUNDS = Number(process.env.ROUNDS || 5);
const SIM_THRESHOLD = Number(process.env.SIM_THRESHOLD || 0.86);
const ROLES = ['A','B','C'];

const pickNext = (prev) => {
  const pool = ROLES.filter(r => r !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
};

// ---------------------- 공용 헬퍼 ----------------------
async function getSessionMessages(sessionId) {
  await connectMongo();
  return Message.find({ sessionId }).sort({ createdAt: 1 });
}

function toTranscript(messages) {
  return messages.map(m => {
    const who = m.speaker === 'interviewer'
      ? `Q(${m.interviewerRole || ''})`
      : 'A';
    return `${who}: ${m.text}`;
  }).join('\n');
}

// ---------------------- 요약/리포트 ----------------------
/**
 * 면접 종료 후 큰 모달에서 보여줄 "짧은 분석" 생성
 * 반환: { summary: string, bullets: string[] }
 * 저장은 하지 않음(요청마다 새로 생성)
 */
async function generateQuickSummary(sessionId) {
  const msgs = await getSessionMessages(sessionId);
  if (!msgs.length) return { summary: '', bullets: [] };

  const transcript = toTranscript(msgs);
  const prompt = [
    '아래 면접 대화의 핵심을 3~5문장으로 한국어로 짧게 요약해줘.',
    '그리고 JSON으로 결과를 반환해. 형식:',
    '{ "summary": "요약 본문 한 단락", "bullets": ["강점 1", "강점/개선 2", "개선 1"] }',
    '말투는 정중하지만 간결하게.',
    '대화:',
    transcript.slice(-6000) // 과도한 길이 방지
  ].join('\n\n');

  const ans = await askDifyApp({ input: prompt, variables: {} });

  try {
    const jsonStart = ans.indexOf('{');
    const jsonEnd = ans.lastIndexOf('}');
    const parsed = JSON.parse(ans.slice(jsonStart, jsonEnd + 1));
    return {
      summary: parsed.summary || '',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 5) : []
    };
  } catch {
    // JSON 파싱 실패 시 본문 전체를 요약으로 사용
    return { summary: ans.trim(), bullets: [] };
  }
}

/**
 * 리포트 페이지용 풀 리포트 생성/저장
 * - 이미 있으면 그대로 반환
 * - 없으면 생성하여 Report 컬렉션에 저장 후 반환
 */
async function generateFullReport(sessionId) {
  await connectMongo();
  const existing = await Report.findOne({ sessionId });
  if (existing) return existing;

  const msgs = await getSessionMessages(sessionId);
  const transcript = toTranscript(msgs);

  const prompt = [
    '아래 면접 대화를 바탕으로 한국어 리포트를 생성해.',
    '형식(JSON만):',
    '{ "summary": "한 단락", "strengths": ["..."], "improvements": ["..."], "recommendations": ["..."] }',
    '각 배열은 3~5개 문장으로, 간결하고 실행가능한 표현을 사용.',
    '대화:',
    transcript.slice(-8000)
  ].join('\n\n');

  const ans = await askDifyApp({ input: prompt, variables: {} });

  let payload = { summary:'', strengths:[], improvements:[], recommendations:[] };
  try {
    const jsonStart = ans.indexOf('{');
    const jsonEnd = ans.lastIndexOf('}');
    payload = JSON.parse(ans.slice(jsonStart, jsonEnd + 1));
  } catch {
    payload.summary = ans.trim();
  }

  const doc = await Report.create({
    sessionId,
    summary: payload.summary || '',
    strengths: payload.strengths || [],
    improvements: payload.improvements || [],
    recommendations: payload.recommendations || [],
  });
  return doc;
}

// ---------------------- 세션/질문 흐름 ----------------------
async function startSession({ userName, userId, jobRole }) {
  await connectMongo();
  await ensureSchema();
  const s = await Session.create({ userName, userId, jobRole, status: 'ongoing' });
  return { sessionId: s._id, displayName: userName };
}

async function handleUserAnswer({ sessionId, userName, userId, jobRole, turn, userAnswer }) {
  await connectMongo();
  await ensureSchema();

  // 1) 사용자 답변 저장 + 업서트
  const a = await Message.create({
    sessionId, userName, userId, speaker: 'user', turn, text: userAnswer
  });
  await upsert('AnswerChunk', {
    text: userAnswer,
    sessionId: String(sessionId),
    userName, userId, jobRole, turn,
    mongoMessageId: String(a._id)
  });

  // 2) 중복질문 회피 힌트
  const similar = await findSimilarQuestions({
    text: userAnswer, sessionId, userName, jobRole, limit: 5
  });
  const hints = similar
    .filter(s => s.similarity >= SIM_THRESHOLD)
    .map(s => s.text)
    .slice(0, 3);

  // 3) 다음 면접관 선택 + 질문 생성
  const lastQ = await Message.findOne({ sessionId, speaker: 'interviewer' }).sort({ createdAt: -1 });
  const role = pickNext(lastQ?.interviewerRole);

  const nextQuestion = await askAgentByRole(role, {
    input: userAnswer,
    variables: { userName, jobRole, avoid: hints }
  });

  // 4) 질문 저장 + 업서트
  const q = await Message.create({
    sessionId, userName, userId,
    speaker: 'interviewer', interviewerRole: role,
    turn: turn + 1, text: nextQuestion
  });
  await upsert('QuestionChunk', {
    text: nextQuestion,
    sessionId: String(sessionId),
    userName, userId, jobRole, turn: turn + 1,
    mongoMessageId: String(q._id), interviewerRole: role
  });

  // 5) 종료 판정(면접관 질문 수 기준)
  const asked = await Message.countDocuments({ sessionId, speaker: 'interviewer' });
  return { nextQuestion, role, isEnd: asked >= ROUNDS, similarUsed: hints };
}

async function finishSession(sessionId) {
  await connectMongo();
  await Session.findByIdAndUpdate(sessionId, { status: 'ended', endedAt: new Date() });
}

module.exports = {
  startSession,
  handleUserAnswer,
  finishSession,
  generateQuickSummary,
  generateFullReport,
};
