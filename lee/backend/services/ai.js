const axios = require('axios');
const FormData = require('form-data');

// ---- ENV (app.js에서 dotenv 로딩 가정) ----
const {
  DIFY_API_URL,
  DIFY_API_KEY,                 // chatbot 앱 키(선택)
  DIFY_AGENT_A_API_KEY,
  DIFY_AGENT_B_API_KEY,
  DIFY_AGENT_C_API_KEY,

  ELEVEN_API_KEY,
  VOICE_ID_A,
  VOICE_ID_B,
  VOICE_ID_C,
  VOICE_ID_DEFAULT,

  ELEVEN_TTS_MODEL,             // 선택: 기본값 'eleven_multilingual_v2'
  ELEVEN_STT_MODEL              // 선택: 기본값 'scribe_v1'
} = process.env;

// ---- Dify ----

// 에이전트별 API 키 매핑
const AGENT_KEYS = {
  A: DIFY_AGENT_A_API_KEY,
  B: DIFY_AGENT_B_API_KEY,
  C: DIFY_AGENT_C_API_KEY,
};

// 공통: Dify 요청 함수
async function postDify({ apiKey, payload }) {
  if (!DIFY_API_URL) throw new Error('DIFY_API_URL is not set');
  if (!apiKey) throw new Error('Dify API key is missing');

  const res = await axios.post(
    `${DIFY_API_URL}/chat-messages`,
    {
      // Dify 표준 필드
      response_mode: 'blocking',
      query: payload.input || '',
      inputs: payload.variables || {},
    },
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 30_000,
    }
  );
  return res.data;
}

// 면접 에이전트(A/B/C)로 질문 생성
async function askAgentByRole(role, { input, variables }) {
  const key = AGENT_KEYS[String(role).toUpperCase()];
  const data = await postDify({ apiKey: key, payload: { input, variables } });
  return data?.answer || '';
}

// (선택) chatbot 앱 키로 호출해야 할 때 사용
async function askDifyApp({ input, variables }) {
  if (!DIFY_API_KEY) throw new Error('DIFY_API_KEY is not set');
  const data = await postDify({ apiKey: DIFY_API_KEY, payload: { input, variables } });
  return data?.answer || '';
}

// ---- ElevenLabs TTS/STT ----

// 역할별 보이스 선택
function resolveVoiceId(role = 'DEFAULT') {
  const r = String(role).toUpperCase();
  const map = { A: VOICE_ID_A, B: VOICE_ID_B, C: VOICE_ID_C, DEFAULT: VOICE_ID_DEFAULT || VOICE_ID_A || VOICE_ID_B || VOICE_ID_C };
  const id = map[r] || map.DEFAULT;
  if (!id) throw new Error(`No voice id configured for role: ${role}`);
  return id;
}

// 텍스트 → 음성
async function textToSpeech(text, role = 'DEFAULT', opts = {}) {
  if (!ELEVEN_API_KEY) throw new Error('ELEVEN_API_KEY is not set');
  if (!text || !text.trim()) throw new Error('TTS text is empty');

  const voiceId = resolveVoiceId(role);
  const model = ELEVEN_TTS_MODEL || 'eleven_multilingual_v2';

  try {
    const res = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text,
        model_id: model,
        voice_settings: {
          stability: opts.stability ?? 0.5,
          similarity_boost: opts.similarity_boost ?? 0.8,
          style: opts.style,               // 선택
          use_speaker_boost: opts.use_speaker_boost ?? true,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVEN_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30_000,
      }
    );
    return res.data; // audio buffer
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error('TTS error:', msg);
    throw new Error(`TTS failed: ${err.response?.status || ''} ${JSON.stringify(msg)}`);
  }
}

// 음성 → 텍스트
async function speechToText(buffer, filename = 'audio.webm', contentType = 'audio/webm') {
  if (!ELEVEN_API_KEY) throw new Error('ELEVEN_API_KEY is not set');
  if (!buffer || !buffer.length) throw new Error('STT buffer is empty');

  const form = new FormData();
  form.append('file', buffer, { filename, contentType });
  form.append('model_id', ELEVEN_STT_MODEL || 'scribe_v1'); // ElevenLabs STT 필수

  try {
    const res = await axios.post(
      'https://api.elevenlabs.io/v1/speech-to-text',
      form,
      {
        headers: {
          'xi-api-key': ELEVEN_API_KEY,
          ...form.getHeaders(),
        },
        timeout: 60_000,
      }
    );
    // ElevenLabs는 { text: "...", words: [...] } 형태
    return res.data?.text || '';
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error('STT error:', msg);
    throw new Error(`STT failed: ${err.response?.status || ''} ${JSON.stringify(msg)}`);
  }
}

module.exports = {
  // Dify
  askAgentByRole,
  askDifyApp,
  // ElevenLabs
  textToSpeech,
  speechToText,
};
