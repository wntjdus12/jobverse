const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// .env 로드 (프로젝트 루트 기준)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// ---- 기본 미들웨어 ----
app.disable('x-powered-by');
app.use(morgan('dev'));

// JSON / URL-Encoded 파서
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CORS 화이트리스트 (ENV로도 덮어쓸 수 있게)
const DEFAULT_ORIGINS = [
  'http://localhost:8501',
  'http://127.0.0.1:8501',
  'https://jobverse.site',
];
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 공통 CORS 옵션
const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/서버사이드
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // 프론트에서 스트림 헤더 읽게 노출
  exposedHeaders: ['interviewer', 'X-Interview-Ended'],
};

app.use(cors(corsOptions));
// ❌ 문제 원인: 와일드카드 OPTIONS 라우트 제거
// app.options('*', cors(corsOptions));

// 리버스 프록시(Nginx/ALB) 뒤에 있으면 켜기
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// (선택) 전역적으로 노출 헤더를 다시 한번 보장
app.use((req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', 'interviewer, X-Interview-Ended');
  next();
});

// ---- 헬스체크 ----
app.get('/healthz', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ---- 라우트 장착 ----
// API_PREFIX 유효성 검사 + 로깅
const rawPrefix = process.env.API_PREFIX || ''; // 예: '/api', '', '/v1'
const looksLikeUrl = /^https?:\/\//i.test(rawPrefix); // 절대 URL 방지
const isValidPrefix = /^$|^(\/[a-zA-Z0-9._-]+)*$/.test(rawPrefix); // 허용: '', '/', '/api', '/api/v1'

// ✅ 빈 문자열/절대 URL/잘못된 패턴이면 무조건 '/'
const API_PREFIX = (looksLikeUrl || !isValidPrefix) ? '/' : (rawPrefix || '/');

if (looksLikeUrl) {
  console.warn(`[app] API_PREFIX looks like a URL ("${rawPrefix}"). Forcing '/'`);
}
if (!isValidPrefix) {
  console.warn(`[app] Invalid API_PREFIX "${rawPrefix}". Forcing '/'`);
}
console.log(`[app] API_PREFIX="${rawPrefix}" -> using "${API_PREFIX}"`);

// routes import / mount 로깅
let routes;
try {
  console.log('[app] importing routes...');
  routes = require('./routes');
  console.log('[app] routes imported');
} catch (e) {
  console.error('[app] routes import failed:', e);
  process.exit(1);
}

try {
  console.log('[app] mounting routes at', API_PREFIX);
  app.use(API_PREFIX, routes); // 최소 '/' 보장
  console.log('[app] routes mounted');
} catch (e) {
  console.error('[app] app.use() failed while mounting routes:', e);
  process.exit(1);
}

// 서버 시작 (EC2/도커 호환 위해 0.0.0.0 권장)
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}${API_PREFIX === '/' ? '' : API_PREFIX}`);
});

module.exports = app;
