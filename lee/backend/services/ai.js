// backend/services/ai.js
const axios = require('axios');
const FormData = require('form-data');

/* ===================== ENV ===================== */
const {
  // Dify
  DIFY_API_URL,
  DIFY_API_KEY,
  DIFY_AGENT_A_API_KEY,
  DIFY_AGENT_B_API_KEY,
  DIFY_AGENT_C_API_KEY,

  // ElevenLabs
  ELEVEN_API_KEY,
  VOICE_ID_A,
  VOICE_ID_B,
  VOICE_ID_C,
  VOICE_ID_DEFAULT,
  ELEVEN_TTS_MODEL,
  ELEVEN_STT_MODEL,

  // OpenAI (요약용)
  OPENAI_API_KEY,
  ANALYSIS_MODEL, // 없으면 기본값 사용
} = process.env;

/* ===================== Dify ===================== */
const AGENT_KEYS = {
  A: DIFY_AGENT_A_API_KEY,
  B: DIFY_AGENT_B_API_KEY,
  C: DIFY_AGENT_C_API_KEY,
};

async function postDify({ apiKey, payload }) {
  if (!DIFY_API_URL) throw new Error('DIFY_API_URL is not set');
  if (!apiKey) throw new Error('Dify API key is missing');

  const res = await axios.post(
    `${DIFY_API_URL}/chat-messages`,
    {
      response_mode: 'blocking',
      query: payload.input || '',
      inputs: payload.variables || {},
    },
    { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 30_000 }
  );
  return res.data;
}

async function askAgentByRole(role, { input, variables }) {
  const key = AGENT_KEYS[String(role).toUpperCase()];
  const data = await postDify({ apiKey: key, payload: { input, variables } });
  return data?.answer || '';
}

async function askDifyApp({ input, variables }) {
  if (!DIFY_API_KEY) throw new Error('DIFY_API_KEY is not set');
  const data = await postDify({ apiKey: DIFY_API_KEY, payload: { input, variables } });
  return data?.answer || '';
}

/* ===================== ElevenLabs TTS/STT ===================== */
function resolveVoiceId(role = 'DEFAULT') {
  const r = String(role).toUpperCase();
  const map = {
    A: VOICE_ID_A,
    B: VOICE_ID_B,
    C: VOICE_ID_C,
    DEFAULT: VOICE_ID_DEFAULT || VOICE_ID_A || VOICE_ID_B || VOICE_ID_C,
  };
  const id = map[r] || map.DEFAULT;
  if (!id) throw new Error(`No voice id configured for role: ${role}`);
  return id;
}

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
          style: opts.style,
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

async function speechToText(buffer, filename = 'audio.webm', contentType = 'audio/webm') {
  if (!ELEVEN_API_KEY) throw new Error('ELEVEN_API_KEY is not set');
  if (!buffer || !buffer.length) throw new Error('STT buffer is empty');

  const form = new FormData();
  form.append('file', buffer, { filename, contentType });
  form.append('model_id', ELEVEN_STT_MODEL || 'scribe_v1');

  try {
    const res = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', form, {
      headers: { 'xi-api-key': ELEVEN_API_KEY, ...form.getHeaders() },
      timeout: 60_000,
    });
    return res.data?.text || '';
  } catch (err) {
    const msg = err.response?.data || err.message;
    console.error('STT error:', msg);
    throw new Error(`STT failed: ${err.response?.status || ''} ${JSON.stringify(msg)}`);
  }
}

/* ===================== OpenAI: 짧은 분석 ===================== */
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const SUMMARY_MODEL = ANALYSIS_MODEL || 'gpt-4o-mini';

// 안전 JSON 추출
function extractJsonBlock(text) {
  if (!text) return null;
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1 || e <= s) return null;
  try {
    return JSON.parse(text.slice(s, e + 1));
  } catch {
    return null;
  }
}

/**
 * 면접 대화 transcript 기반 짧은 분석 생성
 * @param {{ transcript: string }} param0
 * @returns {Promise<{summary: string, bullets: string[]}>}
 */
async function askOpenAIQuickSummary({ transcript }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');

  const system = [
    '너는 면접 대화를 분석하는 어시스턴트야.',
    '반드시 JSON 객체만 반환해. 형식:',
    '{ "summary": "3~5문장 요약", "bullets": ["핵심 포인트1", "핵심/개선 포인트2", "개선 포인트3"] }',
    '한국어로 간결하고 정중하게.',
  ].join('\n');

  const user = [
    '다음 대화를 분석해서 위 형식의 JSON만 반환해.',
    '대화:',
    String(transcript || '').slice(-6000),
  ].join('\n\n');

  const resp = await openai.chat.completions.create({
    model: SUMMARY_MODEL,
    temperature: 0.2,
    // 지원 모델에서 JSON 강제
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const content = resp.choices?.[0]?.message?.content || '';
  const parsed = extractJsonBlock(content);

  if (parsed) {
    return {
      summary: parsed.summary || '',
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 5) : [],
    };
  }
  return { summary: content.trim() || '요약을 생성하지 못했습니다.', bullets: [] };
}

/* ===================== exports ===================== */
module.exports = {
  // Dify
  askAgentByRole,
  askDifyApp,
  // ElevenLabs
  textToSpeech,
  speechToText,
  // OpenAI (요약)
  askOpenAIQuickSummary,
};
