const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

// 설정 및 라우트 import
const db = require('./config/db');
const { PORT } = require('./utils/constants');
const uploadRoutes = require('./routes/uploadRoutes');
const convertRoutes = require('./routes/convertRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { startScheduler } = require('./utils/scheduler');
const { startCleanupScheduler } = require('./utils/tempFileCleanup');
const { logR2Status } = require('./config/r2');
const { withTime } = require('./utils/logger');
const { generalLimiter, uploadLimiter, adminLimiter } = require('./config/rateLimiter');
const generatePages = require('./src/generatePages');

// ============ 필수 환경변수 검증 ============
function validateEnvironment() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'ADMIN_PASSWORD',
    'R2_ENDPOINT',
    'R2_BUCKET',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error(withTime(`❌ 필수 환경변수 없음: ${missing.join(', ')}`));
      console.error(withTime('Railway 환경변수를 설정해주세요.'));
      process.exit(1);
    } else {
      console.warn(withTime(`⚠️  개발 모드: 환경변수 누락 (${missing.join(', ')})`));
      console.warn(withTime('⚠️  기본값을 사용합니다. 프로덕션 배포 전 환경변수를 설정하세요.'));
    }
  } else {
    console.log(withTime('✅ 모든 필수 환경변수 검증됨'));
  }
}

// 서버 시작 전 환경변수 검증
validateEnvironment();

const app = express();

// ============ Middleware ============

// Helmet: HTTP 보안 헤더 (강화된 설정)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://static.cloudflareinsights.com",
        // Gatekeeper Consent
        "https://cmp.gatekeeperconsent.com",
        "https://the.gatekeeperconsent.com",
        // Ezoic
        "https://www.ezojs.com",
        "http://www.ezojs.com",
        // Ad Networks - 모든 HTTPS 허용 (광고 네트워크 도메인이 동적으로 변경됨)
        "https:",
        "'unsafe-inline'",
        "'unsafe-eval'"
      ],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cloudflareinsights.com",
        // Gatekeeper
        "https://privacy.gatekeeperconsent.com",
        // Ezoic
        "https://g.ezoic.net",
        // Ad tracking - 모든 HTTPS 허용
        "https:"
      ],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      scriptSrcAttr: ["'unsafe-inline'"]
    }
  },
  frameguard: {
    action: 'deny' // Clickjacking 방지
  },
  noSniff: true, // MIME sniffing 방지
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  hsts: {
    maxAge: 31536000, // 1년
    includeSubDomains: true,
    preload: true
  }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ============ HTTPS 강제 (프로덕션) ============
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Railway는 X-Forwarded-Proto 헤더로 프로토콜 정보 제공
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(express.static(path.join(__dirname, 'public')));

// Favicon redirect (ico -> png)
app.get('/favicon.ico', (req, res) => {
  res.redirect(301, '/favicon.png');
});


// ============ CORS 설정 ============
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24시간
}));

// ============ Rate Limiting ============
// 일반 API에 Rate Limiting 적용
app.use('/api/', generalLimiter);

// ============ API Routes ============
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/convert', uploadLimiter, convertRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// ============ Health Check Endpoint ============
app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// ============ Test Route ============
app.get('/test', (req, res) => {
  res.json({ message: '서버가 정상 작동 중입니다.' });
});

// ============ 전역 에러 핸들러 ============
// 모든 미처리 라우트
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 비동기 에러 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error(withTime('❌ Unhandled Rejection:'), reason);
  // 프로세스 계속 실행 (Railway가 자동 재시작 처리)
});

process.on('uncaughtException', (error) => {
  console.error(withTime('❌ Uncaught Exception:'), error);
  // 이 경우는 프로세스 종료 후 Railway 자동 재시작
  process.exit(1);
});

// ============ Graceful Shutdown ============
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(withTime(`\n🛑 ${signal} 수신 - 서버 종료 시작...`));

  try {
    // 진행 중인 작업 완료 대기 (최대 30초)
    const shutdownTimeout = setTimeout(() => {
      console.error(withTime('⚠️  30초 타임아웃 - 강제 종료'));
      process.exit(1);
    }, 30000);

    // 리소스 정리
    if (server) {
      server.close(() => {
        clearTimeout(shutdownTimeout);
        console.log(withTime('✅ 서버 종료 완료'));
        process.exit(0);
      });
    }
  } catch (error) {
    console.error(withTime('❌ 종료 중 오류:'), error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============ Generate Pages at Startup ============
try {
  generatePages();
  console.log(withTime('✅ Conversion pages generated at startup'));
} catch (error) {
  console.error(withTime('❌ Failed to generate conversion pages:'), error.message);
  process.exit(1);
}

// ============ Server Start ============
let server;
server = app.listen(PORT, () => {
  console.log(withTime(`🚀 Server is running on http://localhost:${PORT}`));

  // 파일 자동 삭제 스케줄러 시작 (R2 파일 - 10분 만료)
  console.log(withTime(`⏰ R2 파일 정리 스케줄러 시작...`));
  startScheduler();

  // 임시 파일 정리 스케줄러 시작 (로컬 임시 파일 - 24시간 보존)
  console.log(withTime(`🧹 임시 파일 정리 스케줄러 시작...`));
  startCleanupScheduler(60); // 60분마다 실행

  // R2 연결 상태 로그
  logR2Status();
});
