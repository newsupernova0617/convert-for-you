/**
 * ================================
 * 📅 자동 삭제 스케줄러
 * ================================
 * 10분마다 실행되어 만료된 파일을 R2에서 삭제
 * - DB에서 expires_at이 현재 시간보다 이전인 파일 조회
 * - R2에서 해당 파일 삭제
 * - DB의 파일 상태를 'deleted'로 업데이트 (트랜잭션)
 */

const schedule = require('node-schedule');
const db = require('../config/db');
const { deleteFromR2 } = require('../config/r2');
const { withTime } = require('./logger');
const { safeCleanupWithTransaction } = require('./dbTransaction');

/**
 * 만료된 파일 정리 작업 (트랜잭션)
 * - DB에서 만료된 파일 조회
 * - R2에서 파일 삭제
 * - DB 상태 업데이트 (트랜잭션으로 원자성 보장)
 */
const cleanupExpiredFiles = async () => {
  try {
    console.log(withTime(`🔍 만료된 파일 정리 시작...`));

    // DB에서 만료된 파일 조회 (status = 'active' and expires_at <= NOW)
    const stmt = db.prepare(`
      SELECT * FROM files
      WHERE status = 'active' AND expires_at <= datetime('now')
    `);
    const expiredFiles = stmt.all();

    if (expiredFiles.length === 0) {
      console.log(withTime(`✅ 정리할 파일이 없습니다.`));
      return;
    }

    console.log(withTime(`⏰ 만료된 파일 ${expiredFiles.length}개 발견`));

    let successCount = 0;
    let failureCount = 0;

    // 각 파일에 대해 R2 삭제 + DB 업데이트 (트랜잭션)
    for (const file of expiredFiles) {
      try {
        // R2 삭제 작업을 함수로 래핑
        const deleteOperation = async () => {
          console.log(withTime(`🗑️ R2에서 삭제: ${file.r2_path}`));
          await deleteFromR2(file.r2_path);
          return { success: true, r2_path: file.r2_path };
        };

        // R2 삭제 + DB 상태 업데이트를 트랜잭션으로 처리
        const cleanupResult = await safeCleanupWithTransaction(db, deleteOperation, file.file_id);

        console.log(withTime(`✅ 정리 완료: ${file.file_id}`));
        successCount++;
      } catch (error) {
        console.error(withTime(`❌ 파일 정리 실패 (${file.file_id}): ${error.message}`));
        failureCount++;

        // 실패한 파일 상태를 'failed'로 업데이트 (별도 트랜잭션)
        try {
          const failTransaction = db.transaction(() => {
            const failStmt = db.prepare(`
              UPDATE files
              SET status = 'failed'
              WHERE file_id = ?
            `);
            return failStmt.run(file.file_id);
          });
          failTransaction();
          console.log(withTime(`⚠️  ${file.file_id} 상태를 'failed'로 표시`));
        } catch (statusError) {
          console.error(withTime(`❌ 실패 상태 업데이트 불가: ${statusError.message}`));
        }
      }
    }

    console.log(withTime(`🎉 만료된 파일 정리 완료 (성공: ${successCount}, 실패: ${failureCount})`));
  } catch (error) {
    console.error(withTime(`❌ 스케줄러 실행 중 오류: ${error.message}`));
  }
};

/**
 * 스케줄러 시작
 * - 매 2분마다 cleanupExpiredFiles 실행
 * - cron 패턴: 매 2분마다 실행
 */
const startScheduler = () => {
  console.log(withTime(`⏰ 파일 자동 삭제 스케줄러 시작 (2분 주기)`));

  // 매 2분마다 실행
  schedule.scheduleJob('*/2 * * * *', async () => {
    await cleanupExpiredFiles();
  });

  // 서버 시작 시 즉시 한 번 실행
  cleanupExpiredFiles();
};

module.exports = {
  startScheduler,
  cleanupExpiredFiles
};
