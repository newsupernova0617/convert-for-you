const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

describe('Database Tests', () => {
  let db;
  let testDbPath;

  beforeEach(() => {
    // 테스트용 임시 DB 생성
    testDbPath = path.join(__dirname, '../db/test-database.db');

    // 기존 테스트 DB 제거
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = new Database(testDbPath);

    // DB 설정
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -2000;
      PRAGMA auto_vacuum = FULL;
    `);

    // 테이블 생성
    db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT UNIQUE NOT NULL,
        r2_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        deleted_at DATETIME,
        status TEXT DEFAULT 'active'
      );

      CREATE INDEX IF NOT EXISTS idx_file_id ON files(file_id);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON files(expires_at);
      CREATE INDEX IF NOT EXISTS idx_status ON files(status);
    `);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Table Creation', () => {
    test('should create files table with all columns', () => {
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='files'
      `).get();

      expect(result).toBeDefined();
      expect(result.name).toBe('files');
    });

    test('should have correct columns', () => {
      const columns = db.prepare('PRAGMA table_info(files)').all();
      const columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('file_id');
      expect(columnNames).toContain('r2_path');
      expect(columnNames).toContain('file_type');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('expires_at');
      expect(columnNames).toContain('deleted_at');
      expect(columnNames).toContain('status');
    });

    test('should create required indexes', () => {
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND tbl_name='files'
      `).all();

      const indexNames = indexes.map(idx => idx.name);
      expect(indexNames).toContain('idx_file_id');
      expect(indexNames).toContain('idx_expires_at');
      expect(indexNames).toContain('idx_status');
    });
  });

  describe('Insert Operations', () => {
    test('should insert file record successfully', () => {
      const stmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const result = stmt.run(
        '1733367890456-def456',
        'converted/file.docx',
        'converted',
        expiresAt,
        'active'
      );

      expect(result.changes).toBe(1);
    });

    test('should enforce unique file_id', () => {
      const stmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // 첫 번째 삽입 성공
      stmt.run('unique-id-1', 'converted/file1.docx', 'converted', expiresAt, 'active');

      // 두 번째 삽입 실패 (중복)
      expect(() => {
        stmt.run('unique-id-1', 'converted/file2.docx', 'converted', expiresAt, 'active');
      }).toThrow();
    });

    test('should auto-set created_at timestamp', () => {
      const insertStmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      insertStmt.run('test-id', 'converted/file.docx', 'converted', expiresAt, 'active');

      const selectStmt = db.prepare('SELECT created_at FROM files WHERE file_id = ?');
      const result = selectStmt.get('test-id');

      expect(result.created_at).toBeDefined();
      expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      const stmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      stmt.run('file-1', 'converted/file1.docx', 'converted', expiresAt, 'active');
      stmt.run('file-2', 'converted/file2.xlsx', 'converted', expiresAt, 'active');
      stmt.run('file-3', 'converted/file3.pptx', 'converted', expiresAt, 'deleted');
    });

    test('should query file by id', () => {
      const stmt = db.prepare('SELECT * FROM files WHERE file_id = ?');
      const result = stmt.get('file-1');

      expect(result).toBeDefined();
      expect(result.file_id).toBe('file-1');
      expect(result.r2_path).toBe('converted/file1.docx');
    });

    test('should filter by status', () => {
      const stmt = db.prepare('SELECT * FROM files WHERE status = ?');
      const results = stmt.all('active');

      expect(results.length).toBe(2);
      expect(results.every(r => r.status === 'active')).toBe(true);
    });

    test('should query expired files', () => {
      const expiredTime = new Date(Date.now() - 1000).toISOString();
      const insertStmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertStmt.run('expired-file', 'converted/expired.docx', 'converted', expiredTime, 'active');

      const queryStmt = db.prepare('SELECT * FROM files WHERE expires_at <= ? AND status = ?');
      const results = queryStmt.all(new Date().toISOString(), 'active');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.file_id === 'expired-file')).toBe(true);
    });

    test('should return null when file not found', () => {
      const stmt = db.prepare('SELECT * FROM files WHERE file_id = ?');
      const result = stmt.get('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('Update Operations', () => {
    beforeEach(() => {
      const stmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      stmt.run('update-test', 'converted/file.docx', 'converted', expiresAt, 'active');
    });

    test('should update file status', () => {
      const updateStmt = db.prepare('UPDATE files SET status = ? WHERE file_id = ?');
      const result = updateStmt.run('deleted', 'update-test');

      expect(result.changes).toBe(1);

      const selectStmt = db.prepare('SELECT status FROM files WHERE file_id = ?');
      const updatedFile = selectStmt.get('update-test');
      expect(updatedFile.status).toBe('deleted');
    });

    test('should update deleted_at timestamp', () => {
      const now = new Date().toISOString();
      const updateStmt = db.prepare('UPDATE files SET deleted_at = ? WHERE file_id = ?');
      updateStmt.run(now, 'update-test');

      const selectStmt = db.prepare('SELECT deleted_at FROM files WHERE file_id = ?');
      const result = selectStmt.get('update-test');

      expect(result.deleted_at).toBeDefined();
    });

    test('should handle non-existent file update', () => {
      const updateStmt = db.prepare('UPDATE files SET status = ? WHERE file_id = ?');
      const result = updateStmt.run('deleted', 'nonexistent');

      expect(result.changes).toBe(0);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(() => {
      const stmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      stmt.run('delete-test', 'converted/file.docx', 'converted', expiresAt, 'active');
    });

    test('should delete file record', () => {
      const deleteStmt = db.prepare('DELETE FROM files WHERE file_id = ?');
      const result = deleteStmt.run('delete-test');

      expect(result.changes).toBe(1);

      const selectStmt = db.prepare('SELECT * FROM files WHERE file_id = ?');
      const deletedFile = selectStmt.get('delete-test');
      expect(deletedFile).toBeUndefined();
    });

    test('should handle non-existent file deletion', () => {
      const deleteStmt = db.prepare('DELETE FROM files WHERE file_id = ?');
      const result = deleteStmt.run('nonexistent');

      expect(result.changes).toBe(0);
    });
  });

  describe('PRAGMA Settings', () => {
    test('should use WAL journal mode', () => {
      const result = db.pragma('journal_mode', { simple: true });
      expect(result).toBe('wal');
    });

    test('should have foreign keys enabled', () => {
      const result = db.pragma('foreign_keys', { simple: true });
      expect(result).toBe(1);
    });

    test('should use NORMAL synchronous mode', () => {
      const result = db.pragma('synchronous', { simple: true });
      expect(result).toBe(1); // NORMAL = 1
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple inserts', () => {
      const stmt = db.prepare(`
        INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      for (let i = 0; i < 10; i++) {
        stmt.run(
          `file-${i}`,
          `converted/file${i}.docx`,
          'converted',
          expiresAt,
          'active'
        );
      }

      const selectStmt = db.prepare('SELECT COUNT(*) as count FROM files');
      const result = selectStmt.get();

      expect(result.count).toBe(10);
    });

    test('should handle transaction', () => {
      const insertMany = db.transaction((files) => {
        const stmt = db.prepare(`
          INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const file of files) {
          stmt.run(
            file.fileId,
            file.r2Path,
            'converted',
            file.expiresAt,
            'active'
          );
        }
      });

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const filesToInsert = [
        { fileId: 'tx-1', r2Path: 'converted/file1.docx', expiresAt },
        { fileId: 'tx-2', r2Path: 'converted/file2.docx', expiresAt },
      ];

      insertMany(filesToInsert);

      const selectStmt = db.prepare("SELECT COUNT(*) as count FROM files WHERE file_id LIKE 'tx-%'");
      const result = selectStmt.get();

      expect(result.count).toBe(2);
    });
  });
});
