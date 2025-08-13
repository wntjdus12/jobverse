const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');

const { connectMongo, Session, Message } = require('../services/db');
const { ensureSchema, upsert, findSimilarQuestions } = require('../services/vector');
const { textToSpeech, speechToText } = require('../services/ai');
const { generateQuickSummary, generateFullReport } = require('../services/interviewFlow');

// ---- ENV ----
const DIFY_API_URL = process.env.DIFY_API_URL;
const DIFY_AGENT_A_API_KEY = process.env.DIFY_AGENT_A_API_KEY;
const DIFY_AGENT_B_API_KEY = process.env.DIFY_AGENT_B_API_KEY;
const DIFY_AGENT_C_API_KEY = process.env.DIFY_AGENT_C_API_KEY;

const ROUNDS = Number(process.env.ROUNDS || 8);
const SIM_THRESHOLD = Number(process.env.SIM_THRESHOLD || 0.86);
const FOLLOWUP_RATIO = Number(process.env.FOLLOWUP_RATIO || 0.6);

const ROLES = ['A', 'B', 'C'];
const AGENT_KEYS = { A: DIFY_AGENT_A_API_KEY, B: DIFY_AGENT_B_API_KEY, C: DIFY_AGENT_C_API_KEY };

// ---- 유틸 ----
const pickNextRole = (prev) => {
  const pool = ROLES.filter(r => r !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
};
const askedCount = (sessionId) => Message.countDocuments({ sessionId, speaker: 'interviewer' });
const lastInterviewerRole = async (sessionId) => {
  const last = await Message.findOne({ sessionId, speaker: 'interviewer' }).sort({ createdAt: -1 });
  return last?.interviewerRole || null;
};
const recentAskedQuestions = async (sessionId, n = 5) => {
  const docs = await Message.find({ sessionId, speaker: 'interviewer' }).sort({ createdAt: -1 }).limit(n);
  return docs.map(d => d.text).reverse();
};

// -------------------- [1] 면접 시작 --------------------
router.post('/start', async (req, res, next) => {
  try {
    await connectMongo();
    await ensureSchema();

    // 로그인 정보 우선 사용 (없으면 body 폴백)
    const rawName   = (req.user?.name || req.body.userName || req.body.name || '지원자').trim();
    const jobRole   = (req.body.job || req.body.jobRole || '직무 미지정').trim();
    const userId    = (req.user?.id || req.body.userId || null);
    const userEmail = (req.user?.email || req.body.userEmail || null);

    const cleanName = rawName.length > 30 ? '지원자' : rawName.replace(/[^가-힣a-zA-Z0-9 _-]/g, '');
    const session = await Session.create({
      userName: cleanName,
      userId,
      userEmail,
      jobRole,
      status: 'ongoing'
    });

    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const firstQuestion = `${cleanName}님, 자기소개 부탁드립니다.`;

    const qDoc = await Message.create({
      sessionId: session._id,
      userName: cleanName,
      userId,
      userEmail,
      speaker: 'interviewer',
      interviewerRole: role,
      turn: 1,
      text: firstQuestion
    });

    await upsert('QuestionChunk', {
      text: firstQuestion,
      sessionId: String(session._id),
      userName: cleanName,
      userId,
      userEmail,
      jobRole,
      turn: 1,
      mongoMessageId: String(qDoc._id),
      interviewerRole: role
    });

    res.setHeader('interviewer', role);
    res.setHeader('Access-Control-Expose-Headers', 'interviewer');
    res.json({ sessionId: session._id, interviewer: role, question: firstQuestion, isFirst: true });
  } catch (e) {
    next(e);
  }
});

// -------------------- [2] 후속 질문 (SSE 스트리밍) --------------------
router.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, jobRole, message: userAnswer } = req.body;
    const userName  = (req.user?.name || req.body.userName || req.body.name || '지원자').trim();
    const userId    = (req.user?.id || req.body.userId || null);
    const userEmail = (req.user?.email || req.body.userEmail || null);

    if (!sessionId || !userName || !userAnswer?.trim()) {
      return res.status(422).json({ error: 'sessionId, userName, message는 필수입니다.' });
    }

    await connectMongo();
    await ensureSchema();

    // turn 계산(가벼운 방식)
    const lastMsg = await Message.findOne({ sessionId }).sort({ createdAt: -1 });

    // 1) 사용자 답변 저장 + Weaviate 업서트 (항상 먼저!)
    const aDoc = await Message.create({
      sessionId,
      userName,
      userId,
      userEmail,
      speaker: 'user',
      turn: lastMsg?.turn || 1,
      text: userAnswer
    });
    await upsert('AnswerChunk', {
      text: userAnswer,
      sessionId: String(sessionId),
      userName,
      userId,
      userEmail,
      jobRole,
      turn: lastMsg?.turn || 1,
      mongoMessageId: String(aDoc._id)
    });

    // 2) 마지막 질문까지 이미 물었다면 → 지금 답을 저장했으므로 종료
    const asked = await askedCount(sessionId);
    if (asked >= ROUNDS) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ answer: '면접이 종료되었습니다. 참여해 주셔서 감사합니다.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // 3) 중복 회피 힌트 + 최근 질문 목록
    const avoidFromVector = await findSimilarQuestions({
      text: userAnswer,
      sessionId,
      userName,
      userId,
      userEmail,
      jobRole,
      limit: 5
    });
    const avoidHints = avoidFromVector
      .filter(s => s.similarity >= SIM_THRESHOLD)
      .map(s => s.text)
      .slice(0, 3);

    const askedQuestions = await recentAskedQuestions(sessionId, 5);

    // 4) 모드 결정: followup vs new_topic
    const mode = Math.random() < FOLLOWUP_RATIO ? 'followup' : 'new_topic';

    // 5) 다음 면접관 선택 + Dify 스트리밍
    const prevRole = await lastInterviewerRole(sessionId);
    const role = pickNextRole(prevRole);
    const apiKey = AGENT_KEYS[role];
    if (!apiKey) return res.status(400).json({ error: '면접관 API 키 누락' });

    const payload = {
      inputs: {
        userName,
        jobRole,
        mode,                           // 'followup' | 'new_topic'
        avoid: avoidHints,              // 중복 회피 주제
        asked_questions: askedQuestions // 최근 물은 질문 목록
      },
      query: [
        `이전 답변: ${userAnswer}`,
        mode === 'followup'
          ? '위 답변을 더 깊게 파고드는 후속 질문을 한 문장으로 만들어라.'
          : '아직 다루지 않은 역량을 검증할 새로운 질문을 한 문장으로 만들어라.',
        avoidHints.length ? `이 주제는 피하라: ${avoidHints.join(' | ')}` : ''
      ].join('\n'),
      response_mode: 'streaming',
      user: String(sessionId)
    };

    const stream = await axios({
      method: 'POST',
      url: `${DIFY_API_URL}/chat-messages`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: payload,
      responseType: 'stream',
      timeout: 60_000
    });

    // SSE 헤더
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('interviewer', role);
    res.setHeader('Access-Control-Expose-Headers', 'interviewer');

    let fullQuestion = '';
    stream.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(line => line.startsWith('data:'));
      for (const line of lines) {
        const jsonPart = line.replace(/^data:\s*/, '');
        try {
          const parsed = JSON.parse(jsonPart);
          if (parsed.answer) fullQuestion += parsed.answer;
        } catch (_) {}
        res.write(`data: ${jsonPart}\n\n`);
      }
    });

    stream.data.on('end', async () => {
      // 질문 저장 + Weaviate 업서트
      const qDoc = await Message.create({
        sessionId,
        userName,
        userId,
        userEmail,
        speaker: 'interviewer',
        interviewerRole: role,
        turn: (lastMsg?.turn || 1) + 1,
        text: fullQuestion
      });
      await upsert('QuestionChunk', {
        text: fullQuestion,
        sessionId: String(sessionId),
        userName,
        userId,
        userEmail,
        jobRole,
        turn: (lastMsg?.turn || 1) + 1,
        mongoMessageId: String(qDoc._id),
        interviewerRole: role
      });

      res.write('data: [DONE]\n\n');
      res.end();
    });

<<<<<<< HEAD
    stream.data.on('error', (err) => {
      console.error('Dify stream error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Dify 스트림 오류' });
      else res.end();
    });
  } catch (e) {
    next(e);
  }
=======
        response.data.on('end', async () => {
            if (await isDuplicateQuestion(name, fullQuestion)) {
                console.warn('⚠️ 중복 질문:', fullQuestion);
            } else {
                await saveQuestion(name, fullQuestion);
            }
 
            sessionStore[name].round += 1;
            res.write('data: [DONE]\n\n');
            res.end();
        });

        response.data.on('error', (err) => {
            console.error('❌ 스트림 오류:', err);
            res.end();
        });

    } catch (error) {
        console.error("❌ Dify API 오류:", error.message);
        res.status(500).json({ error: 'Dify API 호출 실패', detail: error.message });
    }
};

router.post('/chat', async (req, res) => {
    const { message, user, job, profile_summary } = req.body;
    if (!message?.trim() || !user?.trim()) {
        return res.status(422).json({ error: "message, user는 필수입니다." });
    }
    await saveAnswer(user, message);
    await handleStreaming({ name: user, job, message, profileSummary: profile_summary, res });
>>>>>>> origin/main
});

// -------------------- [3] 텍스트 → 음성 --------------------
router.post('/tts', async (req, res) => {
  try {
    const { text, role = 'DEFAULT' } = req.body;
    const audio = await textToSpeech(text, role);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audio));
  } catch (e) {
    console.error('TTS error:', e.message);
    res.status(500).json({ error: 'TTS 오류', detail: e.message });
  }
});

// -------------------- [4] 음성 → 텍스트 --------------------
const upload = multer();
router.post('/stt', upload.single('file'), async (req, res) => {
  try {
    const { originalname, buffer, mimetype } = req.file || {};
    if (!buffer) return res.status(400).json({ error: '파일이 없습니다.' });
    const text = await speechToText(buffer, originalname || 'audio.webm', mimetype || 'audio/webm');
    res.json({ text });
  } catch (e) {
    console.error('STT error:', e.message);
    res.status(500).json({ error: 'STT 오류', detail: e.message });
  }
});

// -------------------- [5] 요약 / 리포트 --------------------
router.get('/summary/:sessionId', async (req, res, next) => {
  try {
    const out = await generateQuickSummary(req.params.sessionId);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/report/:sessionId', async (req, res, next) => {
  try {
    const report = await generateFullReport(req.params.sessionId);
    res.json(report);
  } catch (e) { next(e); }
});

module.exports = router;
