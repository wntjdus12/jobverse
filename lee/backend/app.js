// backend/app.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

<<<<<<< HEAD
=======
const interviewRoutes = require('./routes/interview');
const chatbotRoutes = require('./routes/chatbot');

>>>>>>> origin/main
// .env 로드 (프로젝트 루트 기준)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const routes = require('./routes'); // <- routes/index.js 를 가져옵니다

const app = express();

<<<<<<< HEAD
// ---- 기본 미들웨어 ----
app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// CORS 화이트리스트 (ENV로도 덮어쓸 수 있게)
const DEFAULT_ORIGINS = [
  'http://localhost:8501',
  'http://127.0.0.1:8501',
  'https://jobverse.site',
];
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',').map(s => s.trim());

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);             // curl/서버사이드
    cb(null, ALLOWED_ORIGINS.includes(origin));     // 허용 여부
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// 리버스 프록시(Nginx/ALB) 뒤에 있으면 켜기
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// ---- 라우트 장착 ----
// 필요하면 '/api' 같은 프리픽스를 ENV로 간단히 추가
const API_PREFIX = process.env.API_PREFIX || ''; // 예: '/api'
app.use(API_PREFIX, routes);

// 서버 시작 (EC2/도커 호환 위해 0.0.0.0 권장)
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}${API_PREFIX}`);
});

module.exports = app;
=======
const ALLOWED_ORIGINS = [
    'http://localhost:8501',
    'http://127.0.0.1:8501',
    'https://jobverse.site',
];
app.use(cors({
    origin(origin, cb) {
    if (!origin) return cb(null, true);                 // curl/서버사이드 등
    return cb(null, ALLOWED_ORIGINS.includes(origin));  // 화이트리스트 체크
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json());

// 헬스체크
app.get('/health', (req, res) => res.json({ ok: true }));

// ✅ 라우터 등록 (프론트와 프리픽스 통일)
app.use('/', interviewRoutes);
app.use('/chatbot-api', chatbotRoutes);

// ✅ /interview-api 하위 404는 JSON으로
app.use('/interview-api', (req, res) => {
    res.status(404).json({ ok: false, error: 'Not Found' });
});

// ✅ 공통 에러 핸들러 (항상 JSON)
app.use((err, req, res, next) => {
    console.error('API Error:', err?.response?.data || err);
    const code = err?.status || err?.response?.status || 500;
    res.status(code).json({
        ok: false,
        error: err?.message || 'Server error',
        detail: err?.response?.data || undefined,
    });
});

// 서버 시작 (EC2/도커 호환 위해 0.0.0.0 권장)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
>>>>>>> origin/main
