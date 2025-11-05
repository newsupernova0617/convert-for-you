/**
 * ================================
 * 📅 자동 삭제 스케줄러
 * ================================
 * 10분마다 실행되어 만료된 파일을 R2에서 삭제
 * - DB에서 expires_at이 현재 시간보다 이전인 파일 조회
 * - R2에서 해당 파일 삭제
 * - DB의 파일 상태를 'deleted'로 업데이트
 */

const schedule = require('node-schedule');
const db = require('../config/db');
const { deleteFromR2 } = require('../config/r2');
const { withTime } = require('./logger');

/**
 * 만료된 파일 정리 작업
 * - DB에서 만료된 파일 조회
 * - R2에서 파일 삭제
 * - DB 상태 업데이트
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

    // 각 파일에 대해 삭제 작업 수행
    for (const file of expiredFiles) {
      try {
        // R2에서 파일 삭제
        console.log(withTime(`🗑️ R2에서 삭제: ${file.r2_path}`));
        await deleteFromR2(file.r2_path);

        // DB 상태 업데이트
        const updateStmt = db.prepare(`
          UPDATE files
          SET status = 'deleted', deleted_at = datetime('now')
          WHERE file_id = ?
        `);
        updateStmt.run(file.file_id);

        console.log(withTime(`✅ 완료: ${file.file_id}`));
      } catch (error) {
        console.error(withTime(`❌ 파일 삭제 실패 (${file.file_id}): ${error.message}`));

        // 실패한 파일 상태를 'failed'로 업데이트
        const failStmt = db.prepare(`
          UPDATE files
          SET status = 'failed'
          WHERE file_id = ?
        `);
        failStmt.run(file.file_id);
      }
    }

    console.log(withTime(`🎉 만료된 파일 정리 완료`));
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
