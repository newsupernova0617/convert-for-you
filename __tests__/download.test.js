const request = require('supertest');
const express = require('express');

// Mock database with proper Drizzle chain structure
// Use mockDatabaseResult to comply with Jest mock restrictions
let mockDatabaseResult = [
  {
    id: 1,
    fileId: '1733367890456-def456',
    r2Path: 'converted/1733367890456-def456.docx',
    fileType: 'converted',
    status: 'active'
  }
];

jest.mock('../drizzle/schema', () => ({
  files: 'files_table'
}));

jest.mock('../config/db', () => ({
  select: jest.fn(function() {
    return {
      from: jest.fn(function() {
        return {
          where: jest.fn(function() {
            // Return a promise that resolves to the current mock result
            return Promise.resolve(mockDatabaseResult);
          })
        };
      })
    };
  })
}));

jest.mock('../utils/logger', () => ({
  withTime: jest.fn(msg => msg)
}));

jest.mock('../config/r2', () => ({
  downloadFromR2: jest.fn(async () => Buffer.from('Converted file content')),
  uploadToR2: jest.fn(),
  deleteFromR2: jest.fn(),
  generateR2Path: jest.fn(),
}));

describe('Download Routes Tests', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset database result to default
    mockDatabaseResult = [
      {
        id: 1,
        fileId: '1733367890456-def456',
        r2Path: 'converted/1733367890456-def456.docx',
        fileType: 'converted',
        status: 'active'
      }
    ];

    mockDb = require('../config/db');

    app = express();
    app.use(express.json());

    // Clear the require cache to reload the route with fresh mocks
    delete require.cache[require.resolve('../routes/downloadRoutes')];
    const downloadRoutes = require('../routes/downloadRoutes');
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

    test('should query database with fileId', async () => {
      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      // Verify that select() was called (part of Drizzle chain)
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should download from R2 with correct path', async () => {
      const mockR2 = require('../config/r2');

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
      mockDatabaseResult = []; // Empty result

      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('찾을 수 없습니다');
    });

    test('should not download from R2 if file not in database', async () => {
      const mockR2 = require('../config/r2');

      mockDatabaseResult = []; // Empty result

      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(mockR2.downloadFromR2).not.toHaveBeenCalled();
    });
  });

  describe('Different File Types', () => {
    test('should handle Word document download', async () => {
      mockDatabaseResult = [
        {
          fileId: 'test-1',
          r2Path: 'converted/file-123.docx',
          status: 'active'
        }
      ];

      const response = await request(app)
        .get('/api/download/test-1');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.docx');
    });

    test('should handle Excel file download', async () => {
      mockDatabaseResult = [
        {
          fileId: 'test-2',
          r2Path: 'converted/file-456.xlsx',
          status: 'active'
        }
      ];

      const response = await request(app)
        .get('/api/download/test-2');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.xlsx');
    });

    test('should handle PowerPoint file download', async () => {
      mockDatabaseResult = [
        {
          fileId: 'test-3',
          r2Path: 'converted/file-789.pptx',
          status: 'active'
        }
      ];

      const response = await request(app)
        .get('/api/download/test-3');

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toContain('.pptx');
    });

    test('should handle image downloads', async () => {
      mockDatabaseResult = [
        {
          fileId: 'test-image',
          r2Path: 'converted/file-image.jpg',
          status: 'active'
        }
      ];

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
      mockDb.select.mockImplementationOnce(() => {
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
      mockDatabaseResult = [
        {
          id: 1,
          fileId: '1733367890456-def456',
          r2Path: 'converted/1733367890456-def456.docx',
          fileType: 'converted',
          status: 'active'
        }
      ];

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('error response should have required fields', async () => {
      mockDatabaseResult = []; // Empty result

      const response = await request(app)
        .get('/api/download/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Status Check', () => {
    test('should only download active files', async () => {
      mockDatabaseResult = [
        {
          id: 1,
          fileId: '1733367890456-def456',
          r2Path: 'converted/1733367890456-def456.docx',
          fileType: 'converted',
          status: 'active'
        }
      ];

      const response = await request(app)
        .get('/api/download/1733367890456-def456');

      expect(response.status).toBe(200);
      // Verify select was called (Drizzle query)
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should reject deleted files', async () => {
      mockDatabaseResult = []; // Simulates deleted file (not found)

      const response = await request(app)
        .get('/api/download/deleted-file-id');

      expect(response.status).toBe(404);
    });
  });
});
