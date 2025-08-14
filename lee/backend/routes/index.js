const express = require('express');
const router = express.Router();

// 토큰에서 사용자 id/name/email을 req.user에 주입(없으면 통과)
const authEnrich = require('../middleware/authEnrich');

// ----- 하위 라우터 -----
router.use('/chatbot', require('./chatbot'));                  // 공개
// 프론트 BASE_URL은 `/interview`로 가정 (예: http://localhost:3000/interview)
// Interview.jsx/EndModal/SummaryModal에서 BASE_URL을 이 경로로 맞춰 호출
router.use('/interview', authEnrich, require('./interview'));  // 로그인 정보 주입(강제 X, enrich)

// ----- 헬스체크 -----
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});
// 일부 로드밸런서가 HEAD를 쓰므로 대응
router.head('/health', (req, res) => res.status(200).end());

// ----- 404 -----
router.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ----- 에러 핸들러 -----
router.use((err, req, res, next) => {
  console.error('API error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = router;