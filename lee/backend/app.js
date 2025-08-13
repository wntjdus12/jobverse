// backend/app.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

const interviewRoutes = require('./routes/interview');
const chatbotRoutes = require('./routes/chatbot');

// .env 로드 (프로젝트 루트 기준)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

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
