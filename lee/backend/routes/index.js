const express = require('express');
const router = express.Router();

// 토큰에서 사용자 id/name/email을 req.user에 주입(없으면 통과)
const authEnrich = require('../middleware/authEnrich');

// 하위 라우터 묶기
router.use('/chatbot', require('./chatbot'));                  // 공개
router.use('/interview', authEnrich, require('./interview'));  // 로그인 정보 주입

// 헬스체크(배포/모니터링용)
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 404 (여기까지 매칭되는 라우트 없을 때)
router.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// 에러 핸들러 (각 라우터에서 throw/next(err) 시 여기로)
router.use((err, req, res, next) => {
  console.error('API error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = router;
