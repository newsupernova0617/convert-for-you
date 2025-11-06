/**
 * ================================
 * 💾 Database Transaction Helper
 * ================================
 * better-sqlite3의 transaction 메서드를 사용한 안전한 데이터 처리
 * 성공하면 자동 커밋, 실패하면 자동 롤백
 */

const { withTime } = require('./logger');

/**
 * 트랜잭션 내에서 파일 메타데이터 삽입
 * @param {Database} db - better-sqlite3 Database instance
 * @param {Object} fileData - 삽입할 파일 데이터
 * @returns {Object} 삽입 결과
 */
const insertFileMetadata = (db, fileData) => {
  const { fileId, r2Path, fileType, expiresAt, status = 'active' } = fileData;

  const stmt = db.prepare(`
    INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  try {
    const result = stmt.run(fileId, r2Path, fileType, expiresAt, status);
    return {
      success: true,
      fileId: fileId,
      changes: result.changes
    };
  } catch (error) {
    console.error(withTime(`❌ DB 삽입 실패 (${fileId}):`, error.message));
    throw error;
  }
};

/**
 * 트랜잭션 내에서 파일 상태 업데이트
 * @param {Database} db - better-sqlite3 Database instance
 * @param {string} fileId - 파일 ID
 * @param {string} status - 새로운 상태
 * @param {string} deletedAt - 삭제 시간 (optional)
 * @returns {Object} 업데이트 결과
 */
const updateFileStatus = (db, fileId, status, deletedAt = null) => {
  let stmt;
  let result;

  if (deletedAt) {
    stmt = db.prepare(`
      UPDATE files
      SET status = ?, deleted_at = ?
      WHERE file_id = ?
    `);
    result = stmt.run(status, deletedAt, fileId);
  } else {
    stmt = db.prepare(`
      UPDATE files
      SET status = ?
      WHERE file_id = ?
    `);
    result = stmt.run(status, fileId);
  }

  return {
    success: true,
    fileId: fileId,
    status: status,
    changes: result.changes
  };
};

/**
 * 파일 메타데이터 조회
 * @param {Database} db - better-sqlite3 Database instance
 * @param {string} fileId - 파일 ID
 * @returns {Object|null} 파일 정보 또는 null
 */
const getFileMetadata = (db, fileId) => {
  const stmt = db.prepare(`
    SELECT * FROM files
    WHERE file_id = ?
  `);
  return stmt.get(fileId);
};

/**
 * 만료된 파일 조회
 * @param {Database} db - better-sqlite3 Database instance
 * @returns {Array} 만료된 파일 목록
 */
const getExpiredFiles = (db) => {
  const stmt = db.prepare(`
    SELECT * FROM files
    WHERE status = 'active' AND expires_at <= datetime('now')
  `);
  return stmt.all();
};

/**
 * 안전한 파일 메타데이터 삽입 (트랜잭션)
 * 실패 시 자동 롤백
 * @param {Database} db - better-sqlite3 Database instance
 * @param {Object} fileData - 파일 데이터
 * @returns {Promise<Object>} 삽입 결과
 */
const safeInsertFileMetadata = async (db, fileData) => {
  const { fileId } = fileData;

  try {
    // 트랜잭션 함수 생성
    const insertTransaction = db.transaction(() => {
      return insertFileMetadata(db, fileData);
    });

    // 트랜잭션 실행 (성공 시 자동 커밋, 실패 시 자동 롤백)
    const result = insertTransaction();
    console.log(withTime(`✅ DB 트랜잭션 완료 (삽입): ${fileId}`));
    return result;
  } catch (error) {
    console.error(withTime(`❌ DB 트랜잭션 실패 (삽입): ${fileId}`), error.message);
    throw error;
  }
};

/**
 * 안전한 파일 상태 업데이트 (트랜잭션)
 * 실패 시 자동 롤백
 * @param {Database} db - better-sqlite3 Database instance
 * @param {string} fileId - 파일 ID
 * @param {string} status - 새로운 상태
 * @param {string} deletedAt - 삭제 시간 (optional)
 * @returns {Promise<Object>} 업데이트 결과
 */
const safeUpdateFileStatus = async (db, fileId, status, deletedAt = null) => {
  try {
    // 트랜잭션 함수 생성
    const updateTransaction = db.transaction(() => {
      return updateFileStatus(db, fileId, status, deletedAt);
    });

    // 트랜잭션 실행
    const result = updateTransaction();
    console.log(withTime(`✅ DB 트랜잭션 완료 (업데이트): ${fileId} → ${status}`));
    return result;
  } catch (error) {
    console.error(withTime(`❌ DB 트랜잭션 실패 (업데이트): ${fileId}`), error.message);
    throw error;
  }
};

/**
 * 복합 트랜잭션: R2 작업 + DB 작업을 원자성으로 처리
 * 주의: async 작업(R2 API)을 포함하므로 별도 처리 필요
 * @param {Database} db - better-sqlite3 Database instance
 * @param {Function} r2Operation - R2 작업 함수 (async)
 * @param {Object} fileData - 파일 데이터
 * @returns {Promise<Object>} 결과
 */
const safeConversionWithTransaction = async (db, r2Operation, fileData) => {
  const { fileId } = fileData;

  try {
    // 1️⃣ R2 작업 수행 (async - DB 트랜잭션 외부)
    console.log(withTime(`🔄 R2 작업 시작: ${fileId}`));
    const r2Result = await r2Operation();
    console.log(withTime(`✅ R2 작업 완료: ${fileId}`));

    // 2️⃣ R2 성공 후 DB 트랜잭션 처리 (동기 - 원자성 보장)
    const dbTransaction = db.transaction(() => {
      return insertFileMetadata(db, fileData);
    });

    const dbResult = dbTransaction();
    console.log(withTime(`✅ DB 트랜잭션 완료: ${fileId}`));

    return {
      success: true,
      fileId: fileId,
      r2Result: r2Result,
      dbResult: dbResult
    };
  } catch (error) {
    console.error(withTime(`❌ 변환 작업 실패: ${fileId}`), error.message);
    // R2 작업이 성공했으면 롤백 불가 (이미 업로드됨)
    // 대신 status='failed'로 표시하거나 수동 정리 필요
    throw error;
  }
};

/**
 * 복합 트랜잭션: R2 삭제 + DB 상태 업데이트를 원자성으로 처리
 * @param {Database} db - better-sqlite3 Database instance
 * @param {Function} r2DeleteOperation - R2 삭제 작업 함수 (async)
 * @param {string} fileId - 파일 ID
 * @returns {Promise<Object>} 결과
 */
const safeCleanupWithTransaction = async (db, r2DeleteOperation, fileId) => {
  try {
    // 1️⃣ R2 삭제 시도
    console.log(withTime(`🔄 R2 삭제 시작: ${fileId}`));
    await r2DeleteOperation();
    console.log(withTime(`✅ R2 삭제 완료: ${fileId}`));

    // 2️⃣ R2 삭제 성공 후 DB 상태 업데이트
    const cleanupTransaction = db.transaction(() => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      return updateFileStatus(db, fileId, 'deleted', now);
    });

    const dbResult = cleanupTransaction();
    console.log(withTime(`✅ DB 트랜잭션 완료: ${fileId}`));

    return {
      success: true,
      fileId: fileId,
      dbResult: dbResult
    };
  } catch (error) {
    console.error(withTime(`❌ 정리 작업 실패: ${fileId}`), error.message);
    throw error;
  }
};

module.exports = {
  // 기본 함수
  insertFileMetadata,
  updateFileStatus,
  getFileMetadata,
  getExpiredFiles,

  // 안전한 함수 (트랜잭션)
  safeInsertFileMetadata,
  safeUpdateFileStatus,
  safeConversionWithTransaction,
  safeCleanupWithTransaction
};
