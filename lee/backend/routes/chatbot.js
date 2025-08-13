const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');

const { textToSpeech, speechToText, askDifyApp } = require('../services/ai');

const upload = multer();

// ENV (dotenv는 app.js에서 로딩되어 있다고 가정)
const DIFY_API_URL = process.env.DIFY_API_URL;   
const DIFY_API_KEY = process.env.DIFY_API_KEY;   

if (!DIFY_API_URL) console.warn('DIFY_API_URL is not set');
if (!DIFY_API_KEY) console.warn('DIFY_API_KEY (chatbot app key) is not set');

// -------------------- [A] 음성 → 텍스트 (STT) --------------------
router.post('/stt', upload.single('file'), async (req, res) => {
  try {
    const { buffer, originalname, mimetype } = req.file || {};
    if (!buffer) return res.status(400).json({ error: '파일이 없습니다.' });

    const text = await speechToText(buffer, originalname || 'audio.webm', mimetype || 'audio/webm');
    res.json({ text });
  } catch (err) {
    console.error('STT error:', err.message);
    res.status(500).json({ error: 'STT 실패', detail: err.message });
  }
});

// -------------------- [B] 텍스트 → 음성 (TTS) --------------------
router.post('/tts', upload.none(), async (req, res) => {
  try {
    const { text, role = 'DEFAULT' } = req.body || {};
    if (!text?.trim()) return res.status(422).json({ error: 'text는 필수입니다.' });

    const audioBuffer = await textToSpeech(text, role);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="speech.mp3"',
    });
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: 'TTS 실패', detail: err.message });
  }
});

// -------------------- [C] 챗봇 대화 (Dify) --------------------
// body: { query: string, inputs?: object, user?: string, stream?: boolean }
router.post('/chat', async (req, res) => {
  const { query, inputs = {}, user = 'chatbot', stream = true } = req.body || {};
  if (!query?.trim()) return res.status(422).json({ error: 'query는 필수입니다.' });

  // 1) 블로킹 응답(간단)
  if (!stream) {
    try {
      const answer = await askDifyApp({ input: query, variables: inputs });
      return res.json({ answer });
    } catch (err) {
      console.error('Dify blocking error:', err.message);
      return res.status(500).json({ error: 'Dify 호출 실패', detail: err.message });
    }
  }

  // 2) 스트리밍(SSE)
  try {
    const r = await axios({
      method: 'POST',
      url: `${DIFY_API_URL}/chat-messages`,
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        query,
        inputs,
        response_mode: 'streaming',
        user,
      },
      responseType: 'stream',
      timeout: 60_000,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    r.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter((l) => l.startsWith('data:'));
      for (const line of lines) {
        const jsonPart = line.replace(/^data:\s*/, '');
        res.write(`data: ${jsonPart}\n\n`);
      }
    });

    r.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    r.data.on('error', (err) => {
      console.error('Dify stream error:', err);
      res.end();
    });
  } catch (err) {
    console.error('Dify stream create error:', err.message);
    res.status(500).json({ error: 'Dify API 호출 실패', detail: err.message });
  }
});

module.exports = router;
