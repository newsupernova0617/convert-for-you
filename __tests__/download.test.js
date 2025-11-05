const request = require('supertest');
const express = require('express');

// Mock 모듈들
jest.mock('../config/db', () => {
  const mockStmt = {
    get: jest.fn((fileId, status) => ({
      id: 1,
      file_id: fileId,
      r2_path: 'converted/1733367890456-def456.docx',
      file_type: 'converted',
      status: 'active'
    }))
  };

  return {
    prepare: jest.fn(() => mockStmt)
  };
});

jest.mock('../config/r2', () => ({
  downloadFromR2: jest.fn(async () => Buffer.from('Converted file content')),
  uploadToR2: jest.fn(),
  deleteFromR2: jest.fn(),
  generateR2Path: jest.fn(),
}));

describe('Download Routes Tests', () => {
  let app;
  let downloadRoutes;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    downloadRoutes = require('../routes/downloadRoutes');
    app.use('/api/download', downloadRoutes);
  });

  describe('GET /api/download/:fileId', () => {
    test('should download file successfully', async () => {
      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('should set correct content headers', async () => {
      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('filename');
      expect(response.headers['content-type']).toContain('application/octet-stream');
    });

    test('should query database with fileId and active status', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockClear();

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM files WHERE file_id = ? AND status = ?')
      );
      expect(mockStmt.get).toHaveBeenCalledWith('1733367890456-def456', 'active');
    });

    test('should download from R2 with correct path', async () => {
      const mockR2 = require('../config/r2');
      mockR2.downloadFromR2.mockClear();

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(mockR2.downloadFromR2).toHaveBeenCalledWith('converted/1733367890456-def456.docx');
    });

    test('should extract filename from R2 path', async () => {
      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.docx');
    });
  });

  describe('File Not Found', () => {
    test('should return 404 when file not found', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce(null);

      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('찾을 수 없습니다');
    });

    test('should not download from R2 if file not in database', async () => {
      const mockDb = require('../config/db');
      const mockR2 = require('../config/r2');
      const mockStmt = mockDb.prepare.mock.results[0].value;

      mockStmt.get.mockReturnValueOnce(null);
      mockR2.downloadFromR2.mockClear();

      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(mockR2.downloadFromR2).not.toHaveBeenCalled();
    });
  });

  describe('Different File Types', () => {
    test('should handle Word document download', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce({
        file_id: 'test-1',
        r2_path: 'converted/file-123.docx',
        status: 'active'
      });

      const response = await request(app)
        .get('/api/download/test-1');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.docx');
    });

    test('should handle Excel file download', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce({
        file_id: 'test-2',
        r2_path: 'converted/file-456.xlsx',
        status: 'active'
      });

      const response = await request(app)
        .get('/api/download/test-2');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });

    test('should handle PowerPoint file download', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce({
        file_id: 'test-3',
        r2_path: 'converted/file-789.pptx',
        status: 'active'
      });

      const response = await request(app)
        .get('/api/download/test-3');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.pptx');
    });

    test('should handle image downloads', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce({
        file_id: 'test-image',
        r2_path: 'converted/file-image.jpg',
        status: 'active'
      });

      const response = await request(app)
        .get('/api/download/test-image');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.jpg');
    });
  });

  describe('Error Handling', () => {
    test('should handle R2 download failure', async () => {
      const mockR2 = require('../config/r2');
      mockR2.downloadFromR2.mockRejectedValueOnce(new Error('R2 download failed'));

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('실패');
    });

    test('should handle database query failure', async () => {
      const mockDb = require('../config/db');
      mockDb.prepare.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    test('successful download should return file buffer', async () => {
      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('error response should have required fields', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce(null);

      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Status Check', () => {
    test('should only download active files', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("status = ?")
      );
      expect(mockStmt.get).toHaveBeenCalledWith(
        expect.anything(),
        'active'
      );
    });

    test('should reject deleted files', async () => {
      const mockDb = require('../config/db');
      const mockStmt = mockDb.prepare.mock.results[0].value;
      mockStmt.get.mockReturnValueOnce(null); // Simulates deleted file (not found)

      const response = await request(app)
        .get('/api/download/deleted-file-id');

      expect(response.status).toBe(404);
    });
  });
});
