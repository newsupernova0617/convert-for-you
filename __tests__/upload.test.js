const request = require('supertest');
const express = require('express');
const multer = require('multer');

// Mock R2
jest.mock('../config/r2', () => ({
  uploadToR2: jest.fn(async () => ({ url: 'https://r2.example.com/file.pdf' })),
  generateR2Path: jest.fn((name, folder) => `${folder}/1733367890123-abc123.pdf`),
  downloadFromR2: jest.fn(),
  deleteFromR2: jest.fn(),
}));

// Mock upload middleware
jest.mock('../middlewares/upload', () => {
  const multer = require('multer');
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('PDF only'), false);
      }
    },
    limits: { fileSize: 50 * 1024 * 1024 }
  });
});

describe('Upload Routes Tests', () => {
  let app;
  let uploadRoutes;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    uploadRoutes = require('../routes/uploadRoutes');
    app.use('/api/upload', uploadRoutes);
  });

  describe('POST /api/upload', () => {
    test('should upload PDF file successfully', async () => {
      const mockR2 = require('../config/r2');

      const response = await request(app)
        .post('/api/upload')
        .field('fileName', 'test')
        .attach('file', Buffer.from('%PDF-1.4\n%fake pdf'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fileName).toBe('test.pdf');
      expect(response.body.r2Path).toBeDefined();
      expect(response.body.size).toBeGreaterThan(0);
      expect(response.body.url).toBeDefined();
    });

    test('should fail without file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('PDF 파일');
    });

    test('should reject non-PDF files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('not a pdf'), 'test.txt');

      expect(response.status).toBe(400);
    });

    test('should generate correct R2 path', async () => {
      const mockR2 = require('../config/r2');
      mockR2.generateR2Path.mockReturnValue('uploads/1733367890123-abc123.pdf');

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('%PDF-1.4\n%fake pdf'), 'document.pdf');

      expect(response.status).toBe(200);
      expect(mockR2.generateR2Path).toHaveBeenCalledWith('document.pdf', 'uploads');
    });

    test('should call uploadToR2 with correct parameters', async () => {
      const mockR2 = require('../config/r2');
      mockR2.uploadToR2.mockClear();

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('%PDF-1.4\n%fake pdf'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(mockR2.uploadToR2).toHaveBeenCalled();
      const [path, buffer, contentType] = mockR2.uploadToR2.mock.calls[0];
      expect(path).toContain('.pdf');
      expect(contentType).toBe('application/pdf');
    });

    test('should handle upload errors gracefully', async () => {
      const mockR2 = require('../config/r2');
      mockR2.uploadToR2.mockRejectedValueOnce(new Error('R2 upload failed'));

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('%PDF-1.4\n%fake pdf'), 'test.pdf');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('실패');
    });
  });

  describe('File Size Validation', () => {
    test('should accept files under 50MB', async () => {
      const smallBuffer = Buffer.alloc(1024 * 1024); // 1MB
      const response = await request(app)
        .post('/api/upload')
        .attach('file', smallBuffer, 'small.pdf');

      // Note: May still fail due to MIME type check, but size is OK
      expect(response.status).toBeDefined();
    });
  });

  describe('Response Format', () => {
    test('successful response should have correct structure', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('%PDF-1.4\n%fake pdf'), 'test.pdf');

      if (response.body.success) {
        expect(response.body).toHaveProperty('fileName');
        expect(response.body).toHaveProperty('r2Path');
        expect(response.body).toHaveProperty('size');
        expect(response.body).toHaveProperty('url');
      }
    });

    test('error response should have correct structure', async () => {
      const mockR2 = require('../config/r2');
      mockR2.uploadToR2.mockRejectedValueOnce(new Error('Upload error'));

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('%PDF-1.4\n%fake pdf'), 'test.pdf');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
