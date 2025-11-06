const rateLimit = require('express-rate-limit');

/**
 * 로그인 API용 Rate Limiter
 * 15분 내 5회 이상 실패하면 차단
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 요청
  message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.',
  standardHeaders: true, // RateLimit 헤더 반환
  legacyHeaders: false, // X-RateLimit 헤더 비활성화
  skip: (req, res) => {
    // 옵션: 특정 IP는 제한 제외 (예: localhost 개발 환경)
    return req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development';
  }
});

/**
 * 일반 API용 Rate Limiter
 * 15분 내 100회 이상 요청하면 차단
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    return req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development';
  }
});

/**
 * 파일 업로드용 Rate Limiter
 * 15분 내 50회 이상 업로드 시도하면 차단
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 50, // 최대 50회 업로드
  message: '업로드가 너무 많습니다. 15분 후 다시 시도하세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    return req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development';
  }
});

/**
 * 관리자 API용 Rate Limiter (더 엄격)
 * 15분 내 30회 이상 요청하면 차단
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 30, // 최대 30회 요청
  message: '요청이 너무 많습니다. 15분 후 다시 시도하세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    return req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development';
  }
});

module.exports = {
  loginLimiter,
  generalLimiter,
  uploadLimiter,
  adminLimiter
};
