const request = require('supertest');
const express = require('express');

// Mock 모듈들
jest.mock('../config/db', () => ({
  prepare: jest.fn(() => ({
    run: jest.fn(),
    get: jest.fn(() => ({ id: 1, file_id: 'test-id' })),
  })),
}));

jest.mock('../config/r2', () => ({
  downloadFromR2: jest.fn(async () => Buffer.from('%PDF-1.4\nMock PDF')),
  uploadToR2: jest.fn(async () => ({ url: 'https://r2.example.com/converted.docx' })),
  deleteFromR2: jest.fn(async () => ({})),
  generateR2Path: jest.fn((name, folder) => `${folder}/1733367890456-def456.docx`),
}));

jest.mock('../utils/converterPool', () => ({
  convert: jest.fn(async () => ({
    success: true,
    buffer: Buffer.from('Converted file content'),
    format: 'docx'
  })),
}));

jest.mock('../utils/constants', () => ({
  EXTENSION_MAP: {
    'word': '.docx',
    'excel': '.xlsx',
    'ppt': '.pptx',
    'jpg': '.jpg',
    'png': '.png'
  },
  PORT: 3002,
  NODE_ENV: 'development',
  UPLOAD_DIR: './uploads',
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  CONVERSION_DELAY: 2000,
  ADSENSE_PUBLISHER_ID: 'ca-pub-test'
}));

describe('Convert Routes Tests', () => {
  let app;
  let convertRoutes;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    convertRoutes = require('../routes/convertRoutes');
    app.use('/api/convert', convertRoutes);
  });

  describe('POST /api/convert', () => {
    test('should convert PDF to Word successfully', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fileId).toBeDefined();
      expect(response.body.r2Path).toContain('.docx');
      expect(response.body.fileName).toContain('_converted');
    });

    test('should support all conversion formats', async () => {
      const formats = ['word', 'excel', 'ppt', 'jpg', 'png'];

      for (const format of formats) {
        const response = await request(app)
          .post('/api/convert')
          .send({
            r2Path: 'uploads/1733367890123-abc123.pdf',
            format: format,
            originalName: 'document.pdf'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.fileId).toBeDefined();
      }
    });

    test('should reject invalid format', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'invalid_format',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('지원하지 않는');
    });

    test('should require r2Path and format', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('필요');
    });

    test('should validate r2Path presence', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate format presence', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Conversion Workflow', () => {
    test('should download PDF from R2', async () => {
      const mockR2 = require('../config/r2');
      mockR2.downloadFromR2.mockClear();

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(mockR2.downloadFromR2).toHaveBeenCalledWith('uploads/1733367890123-abc123.pdf');
    });

    test('should call Piscina converter', async () => {
      const mockConverter = require('../utils/converterPool');
      mockConverter.convert.mockClear();

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'excel',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(mockConverter.convert).toHaveBeenCalled();
      const [buffer, format] = mockConverter.convert.mock.calls[0];
      expect(format).toBe('excel');
    });

    test('should upload converted file to R2', async () => {
      const mockR2 = require('../config/r2');
      mockR2.uploadToR2.mockClear();

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'ppt',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(mockR2.uploadToR2).toHaveBeenCalled();
      const [path, buffer, contentType] = mockR2.uploadToR2.mock.calls[0];
      expect(path).toContain('converted');
    });

    test('should delete original file from R2', async () => {
      const mockR2 = require('../config/r2');
      mockR2.deleteFromR2.mockClear();

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(mockR2.deleteFromR2).toHaveBeenCalledWith('uploads/1733367890123-abc123.pdf');
    });

    test('should save file metadata to database', async () => {
      const mockDb = require('../config/db');
      const mockPrepare = mockDb.prepare();

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO files'));
    });
  });

  describe('Error Handling', () => {
    test('should handle R2 download failure', async () => {
      const mockR2 = require('../config/r2');
      mockR2.downloadFromR2.mockRejectedValueOnce(new Error('R2 download failed'));

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('실패');
    });

    test('should handle conversion failure', async () => {
      const mockConverter = require('../utils/converterPool');
      mockConverter.convert.mockResolvedValueOnce({
        success: false,
        error: 'LibreOffice conversion failed'
      });

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('should handle R2 upload failure', async () => {
      const mockR2 = require('../config/r2');
      mockR2.uploadToR2.mockRejectedValueOnce(new Error('R2 upload failed'));

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('File Naming', () => {
    test('should generate correct converted filename for Word', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/test.pdf',
          format: 'word',
          originalName: 'myfile.pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body.fileName).toContain('myfile_converted');
      expect(response.body.fileName).toContain('.docx');
    });

    test('should generate correct filename for different formats', async () => {
      const testCases = [
        { format: 'word', ext: '.docx' },
        { format: 'excel', ext: '.xlsx' },
        { format: 'ppt', ext: '.pptx' },
        { format: 'jpg', ext: '.jpg' },
        { format: 'png', ext: '.png' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/convert')
          .send({
            r2Path: 'uploads/document.pdf',
            format: testCase.format,
            originalName: 'document.pdf'
          });

        expect(response.status).toBe(200);
        expect(response.body.fileName).toContain('_converted');
        expect(response.body.fileName).toContain(testCase.ext);
      }
    });
  });

  describe('Response Format', () => {
    test('successful response should have required fields', async () => {
      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fileId');
      expect(response.body).toHaveProperty('r2Path');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('message');
    });

    test('error response should have required fields', async () => {
      const mockConverter = require('../utils/converterPool');
      mockConverter.convert.mockResolvedValueOnce({
        success: false,
        error: 'Test error'
      });

      const response = await request(app)
        .post('/api/convert')
        .send({
          r2Path: 'uploads/1733367890123-abc123.pdf',
          format: 'word',
          originalName: 'document.pdf'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });
  });
});
