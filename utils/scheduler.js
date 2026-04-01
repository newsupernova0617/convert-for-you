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
const { eq, lte, and } = require('drizzle-orm');
const { files } = require('../drizzle/schema');
const db = require('../config/db');
const { deleteFromR2 } = require('../config/r2');
const { withTime } = require('./logger');

/**
 * 만료된 파일 정리 작업 (Drizzle ORM)
 * - DB에서 만료된 파일 조회
 * - R2에서 파일 삭제
 * - DB 상태 업데이트
 */
const cleanupExpiredFiles = async () => {
  try {
    console.log(withTime(`🔍 만료된 파일 정리 시작...`));

    const now = new Date().toISOString();

    // Select expired files using Drizzle
    const expiredFiles = await db
      .select()
      .from(files)
      .where(and(
        lte(files.expiresAt, now),
        eq(files.status, 'active')
      ));

    if (expiredFiles.length === 0) {
      console.log(withTime(`✅ 정리할 파일이 없습니다.`));
      return;
    }

    console.log(withTime(`⏰ 만료된 파일 ${expiredFiles.length}개 발견`));

    let successCount = 0;
    let failureCount = 0;

    // 각 파일에 대해 R2 삭제 + DB 업데이트
    for (const file of expiredFiles) {
      try {
        // R2에서 파일 삭제
        console.log(withTime(`🗑️ R2에서 삭제: ${file.r2Path}`));
        await deleteFromR2(file.r2Path);

        // DB 상태 업데이트 (Drizzle)
        await db
          .update(files)
          .set({ status: 'deleted', deletedAt: new Date().toISOString() })
          .where(eq(files.fileId, file.fileId));

        console.log(withTime(`✅ 정리 완료: ${file.fileId}`));
        successCount++;
      } catch (error) {
        console.error(withTime(`❌ 파일 정리 실패 (${file.fileId}): ${error.message}`));
        failureCount++;

        // 실패한 파일 상태를 'failed'로 업데이트
        try {
          await db
            .update(files)
            .set({ status: 'failed' })
            .where(eq(files.fileId, file.fileId));

          console.log(withTime(`⚠️  ${file.fileId} 상태를 'failed'로 표시`));
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
 * - SCHEDULER_INTERVAL_MINUTES 환경변수로 주기 설정 (기본: 2분)
 * - cron 패턴으로 실행
 */
const startScheduler = () => {
  const intervalMinutes = parseInt(process.env.SCHEDULER_INTERVAL_MINUTES) || 2;
  const cronPattern = `*/${intervalMinutes} * * * *`;

  console.log(withTime(`⏰ 파일 자동 삭제 스케줄러 시작 (${intervalMinutes}분 주기)`));

  // 지정된 주기마다 실행
  schedule.scheduleJob(cronPattern, async () => {
    await cleanupExpiredFiles();
  });

  // 서버 시작 시 즉시 한 번 실행
  cleanupExpiredFiles();
};

module.exports = {
  startScheduler,
  cleanupExpiredFiles
};
