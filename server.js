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
const { startScheduler } = require('./utils/scheduler');
const { logR2Status } = require('./config/r2');
const { withTime } = require('./utils/logger');

const app = express();

// ============ Middleware ============

// Helmet: HTTP 보안 헤더 (CSP 설정 포함)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

// ============ API Routes ============
app.use('/api/upload', uploadRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/download', downloadRoutes);

// ============ Test Route ============
app.get('/test', (req, res) => {
  res.json({ message: '서버가 정상 작동 중입니다.' });
});

// ============ Server Start ============
app.listen(PORT, () => {
  console.log(withTime(`🚀 Server is running on http://localhost:${PORT}`));

  // 파일 자동 삭제 스케줄러 시작
  console.log(withTime(`⏰ 파일 정리 스케줄러 시작...`));
  startScheduler();

  // R2 연결 상태 로그
  logR2Status();
});
