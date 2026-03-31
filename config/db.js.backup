const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '../db/database.db');
const db = new Database(dbPath);

// DB 설정
db.exec(`
  PRAGMA journal_mode = WAL;        -- 빠르고 안정적인 WAL 모드
  PRAGMA synchronous = NORMAL;      -- FULL보다 약간 빠르지만 여전히 안전
  PRAGMA foreign_keys = ON;         -- 외래키 제약조건 활성화
  PRAGMA temp_store = MEMORY;       -- 임시 테이블을 메모리에 저장 (속도 향상)
  PRAGMA cache_size = -2000;        -- 캐시를 약 2,000페이지 (~2MB 정도)로 설정
  PRAGMA auto_vacuum = FULL;        -- 삭제된 공간 자동 회수
`);

// 파일 메타데이터 테이블 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT UNIQUE NOT NULL,              -- 고유 파일 ID (타임스탐프 기반)
    r2_path TEXT NOT NULL,                     -- R2 저장 경로
    file_type TEXT NOT NULL,                   -- 'converted' (변환된 파일만 추적)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 생성 시간
    expires_at DATETIME NOT NULL,              -- 삭제 예정 시간 (생성 후 10분)
    deleted_at DATETIME,                       -- 실제 삭제 시간
    status TEXT DEFAULT 'active'               -- 'active', 'deleted', 'failed'
  );

  CREATE INDEX IF NOT EXISTS idx_file_id ON files(file_id);
  CREATE INDEX IF NOT EXISTS idx_expires_at ON files(expires_at);
  CREATE INDEX IF NOT EXISTS idx_status ON files(status);
`);

module.exports = db;
