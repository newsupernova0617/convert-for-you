const request = require('supertest');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

// Mock 모듈들
jest.mock('../config/db');
jest.mock('../utils/scheduler');
jest.mock('../config/r2');
jest.mock('../routes/uploadRoutes', () => (req, res, next) => {
  res.json({ mocked: true });
});
jest.mock('../routes/convertRoutes', () => (req, res, next) => {
  res.json({ mocked: true });
});
jest.mock('../routes/downloadRoutes', () => (req, res, next) => {
  res.json({ mocked: true });
});

describe('Server Tests', () => {
  let app;

  beforeEach(() => {
    // 각 테스트마다 새로운 Express 앱 생성
    app = express();

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
    app.use(express.static(path.join(__dirname, '../public')));

    // 라우트
    app.use('/api/upload', require('../routes/uploadRoutes'));
    app.use('/api/convert', require('../routes/convertRoutes'));
    app.use('/api/download', require('../routes/downloadRoutes'));

    // Test 엔드포인트
    app.get('/test', (req, res) => {
      res.json({ message: '서버가 정상 작동 중입니다.' });
    });
  });

  describe('Health Check', () => {
    test('GET /test should return success message', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: '서버가 정상 작동 중입니다.'
      });
    });
  });

  describe('API Routes', () => {
    test('POST /api/upload should be mocked', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.mocked).toBe(true);
    });

    test('POST /api/convert should be mocked', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.mocked).toBe(true);
    });

    test('GET /api/download/:fileId should be mocked', async () => {
      const response = await request(app)
        .get('/api/download/test-file-id');

      expect(response.status).toBe(200);
      expect(response.body.mocked).toBe(true);
    });
  });

  describe('Security Headers', () => {
    test('Response should include Helmet security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('Should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });
  });
});
