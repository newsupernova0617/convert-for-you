const jwt = require('jsonwebtoken');
const { withTime } = require('../utils/logger');

// 환경변수는 server.js에서 이미 검증됨
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * 관리자 비밀번호를 검증하고 JWT 토큰 발급
 */
const login = (password) => {
  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: '잘못된 비밀번호입니다.' };
  }

  const token = jwt.sign(
    { role: 'admin', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { success: true, token };
};

/**
 * JWT 토큰 검증 미들웨어
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: '토큰이 없습니다.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(withTime(`❌ 토큰 검증 실패: ${err.message}`));
      return res.status(403).json({ success: false, error: '유효하지 않은 토큰입니다.' });
    }
    req.admin = decoded;
    next();
  });
};

/**
 * 관리자 토큰 새로고침
 */
const refreshToken = (req, res) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, error: '인증되지 않았습니다.' });
  }

  const newToken = jwt.sign(
    { role: 'admin', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ success: true, token: newToken });
};

module.exports = {
  login,
  verifyToken,
  refreshToken,
  JWT_SECRET,
  ADMIN_PASSWORD
};
