const jwt = require('jsonwebtoken');

module.exports = (req, _res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!token) return next(); // 비로그인 허용이면 통과
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY); // 팀장 키 그대로 사용
    req.user = { id: (payload.id || payload._id || '').toString() };
  } catch (_) {
    // 로그인 필수로 만들려면 여기서 401 반환하면 됨
  }
  next();
};
