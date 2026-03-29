/**
 * ================================
 * 🧹 임시 파일 정리 스케줄러
 * ================================
 * 오래된 임시 파일을 주기적으로 정리하여 디스크 공간 확보
 * 
 * 실행 주기: 매 시간마다
 * 정리 대상: 24시간 이상 된 임시 파일
 * 
 * 정리 패턴:
 * - pdf-to-* (PDF 변환)
 * - video-input-*, video-output-* (비디오 변환)
 * - audio-input-*, audio-output-* (오디오 변환)
 * - video-metadata-*, audio-metadata-* (메타데이터)
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { withTime } = require('./logger');

// 정리할 임시 파일 패턴
const TEMP_FILE_PATTERNS = [
    'pdf-to-',
    'video-input-',
    'video-output-',
    'video-metadata-',
    'audio-input-',
    'audio-output-',
    'audio-metadata-',
    'image-',
    'office-to-pdf-'
];

// 파일 최대 보존 시간 (밀리초)
const MAX_FILE_AGE = parseInt(process.env.TEMP_FILE_MAX_AGE) || 24 * 60 * 60 * 1000; // 기본 24시간

/**
 * 오래된 임시 파일 정리
 * @returns {Promise<{deleted: number, failed: number, errors: Array}>}
 */
async function cleanupOldTempFiles() {
    const tmpDir = os.tmpdir();
    const now = Date.now();

    let deletedCount = 0;
    let failedCount = 0;
    const errors = [];

    console.log(withTime('🧹 임시 파일 정리 시작...'));
    console.log(withTime(`📁 대상 디렉토리: ${tmpDir}`));
    console.log(withTime(`⏰ 보존 기간: ${MAX_FILE_AGE / 1000 / 60 / 60}시간`));

    try {
        // 임시 디렉토리의 모든 파일 목록 가져오기
        const allFiles = await fs.readdir(tmpDir);

        // 패턴별로 처리
        for (const pattern of TEMP_FILE_PATTERNS) {
            // 패턴에 맞는 파일 필터링
            const matchingFiles = allFiles.filter(file => file.startsWith(pattern));

            if (matchingFiles.length === 0) {
                continue; // 해당 패턴의 파일이 없으면 스킵
            }

            console.log(withTime(`🔍 패턴 "${pattern}*" 검사 중... (${matchingFiles.length}개 파일)`));

            for (const file of matchingFiles) {
                const filePath = path.join(tmpDir, file);

                try {
                    // 파일 정보 가져오기
                    const stats = await fs.stat(filePath);
                    const fileAge = now - stats.mtimeMs;

                    // 파일이 최대 보존 시간을 초과했는지 확인
                    if (fileAge > MAX_FILE_AGE) {
                        // 파일 삭제
                        await fs.unlink(filePath);
                        deletedCount++;

                        const ageHours = (fileAge / 1000 / 60 / 60).toFixed(1);
                        console.log(withTime(`  ✓ 삭제: ${file} (${ageHours}시간 경과)`));
                    }
                } catch (error) {
                    // 개별 파일 처리 실패는 기록하고 계속 진행
                    failedCount++;
                    errors.push({ file, error: error.message });

                    // ENOENT (파일 없음) 에러는 무시 (이미 삭제됨)
                    if (error.code !== 'ENOENT') {
                        console.warn(withTime(`  ⚠️  실패: ${file} - ${error.message}`));
                    }
                }
            }
        }

        // 결과 요약
        console.log(withTime(''));
        console.log(withTime('📊 정리 완료:'));
        console.log(withTime(`  ✅ 삭제: ${deletedCount}개`));
        console.log(withTime(`  ⚠️  실패: ${failedCount}개`));

        if (deletedCount > 0) {
            console.log(withTime(`  💾 예상 확보 공간: ~${(deletedCount * 10).toFixed(0)}MB`));
        }

        return { deleted: deletedCount, failed: failedCount, errors };
    } catch (error) {
        console.error(withTime('❌ 임시 파일 정리 중 오류 발생:'), error.message);
        throw error;
    }
}

/**
 * 디스크 사용량 확인 (선택적)
 * @returns {Promise<number>} 사용률 (0-100)
 */
async function checkDiskUsage() {
    try {
        const { execSync } = require('child_process');
        const platform = os.platform();

        if (platform === 'win32') {
            // Windows: wmic 사용
            const tmpDir = os.tmpdir();
            const drive = tmpDir.substring(0, 2); // C:
            const output = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get FreeSpace,Size`, { encoding: 'utf8' });
            const lines = output.trim().split('\n').filter(line => line.trim());

            if (lines.length >= 2) {
                const [freeSpace, size] = lines[1].trim().split(/\s+/).map(Number);
                const usedPercent = ((size - freeSpace) / size) * 100;
                return usedPercent;
            }
        } else {
            // Linux/Mac: df 사용
            const tmpDir = os.tmpdir();
            const output = execSync(`df -k "${tmpDir}" | tail -1`, { encoding: 'utf8' });
            const parts = output.trim().split(/\s+/);
            const usedPercent = parseInt(parts[4]); // "85%" -> 85
            return usedPercent;
        }
    } catch (error) {
        console.warn(withTime('⚠️  디스크 사용량 확인 실패:'), error.message);
        return 0;
    }
}

/**
 * 긴급 정리 (디스크 사용량이 높을 때)
 * 보존 기간을 무시하고 모든 임시 파일 삭제
 */
async function emergencyCleanup() {
    const tmpDir = os.tmpdir();
    let deletedCount = 0;

    console.log(withTime('🚨 긴급 정리 모드 시작!'));

    try {
        const allFiles = await fs.readdir(tmpDir);

        for (const pattern of TEMP_FILE_PATTERNS) {
            const matchingFiles = allFiles.filter(file => file.startsWith(pattern));

            for (const file of matchingFiles) {
                const filePath = path.join(tmpDir, file);
                try {
                    await fs.unlink(filePath);
                    deletedCount++;
                } catch (error) {
                    // 무시하고 계속
                }
            }
        }

        console.log(withTime(`🚨 긴급 정리 완료: ${deletedCount}개 파일 삭제`));
        return deletedCount;
    } catch (error) {
        console.error(withTime('❌ 긴급 정리 실패:'), error.message);
        throw error;
    }
}

/**
 * 스케줄러 시작
 * @param {number} intervalMinutes - 실행 주기 (분 단위, 기본 60분)
 */
function startCleanupScheduler(intervalMinutes = 60) {
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(withTime(''));
    console.log(withTime('🕐 임시 파일 정리 스케줄러 시작'));
    console.log(withTime(`⏰ 실행 주기: ${intervalMinutes}분마다`));
    console.log(withTime(`📁 보존 기간: ${MAX_FILE_AGE / 1000 / 60 / 60}시간`));
    console.log(withTime(''));

    // 즉시 한 번 실행
    cleanupOldTempFiles().catch(error => {
        console.error(withTime('❌ 초기 정리 실패:'), error.message);
    });

    // 주기적으로 실행
    const intervalId = setInterval(async () => {
        try {
            // 디스크 사용량 확인
            const diskUsage = await checkDiskUsage();

            if (diskUsage > 0) {
                console.log(withTime(`💾 디스크 사용량: ${diskUsage.toFixed(1)}%`));
            }

            // 디스크 사용량이 90% 이상이면 긴급 정리
            if (diskUsage >= 90) {
                console.warn(withTime('⚠️  디스크 사용량 90% 초과! 긴급 정리 시작...'));
                await emergencyCleanup();
            } else {
                // 일반 정리
                await cleanupOldTempFiles();
            }
        } catch (error) {
            console.error(withTime('❌ 정리 스케줄러 오류:'), error.message);
        }
    }, intervalMs);

    // Graceful shutdown 시 정리
    const cleanup = () => {
        console.log(withTime('🛑 정리 스케줄러 종료...'));
        clearInterval(intervalId);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    return intervalId;
}

/**
 * 통계 조회
 */
async function getCleanupStats() {
    const tmpDir = os.tmpdir();
    const stats = {
        totalFiles: 0,
        totalSize: 0,
        oldFiles: 0,
        oldSize: 0
    };

    try {
        const allFiles = await fs.readdir(tmpDir);
        const now = Date.now();

        for (const pattern of TEMP_FILE_PATTERNS) {
            const matchingFiles = allFiles.filter(file => file.startsWith(pattern));

            for (const file of matchingFiles) {
                const filePath = path.join(tmpDir, file);
                try {
                    const fileStats = await fs.stat(filePath);
                    stats.totalFiles++;
                    stats.totalSize += fileStats.size;

                    const fileAge = now - fileStats.mtimeMs;
                    if (fileAge > MAX_FILE_AGE) {
                        stats.oldFiles++;
                        stats.oldSize += fileStats.size;
                    }
                } catch (error) {
                    // 무시
                }
            }
        }

        return stats;
    } catch (error) {
        console.error(withTime('❌ 통계 조회 실패:'), error.message);
        return stats;
    }
}

module.exports = {
    cleanupOldTempFiles,
    emergencyCleanup,
    startCleanupScheduler,
    checkDiskUsage,
    getCleanupStats
};
