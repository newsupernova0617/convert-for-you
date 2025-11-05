/**
 * ================================
 * 🔧 Piscina 스레드 풀 관리
 * ================================
 * LibreOffice 변환 작업을 여러 스레드에서 병렬 처리
 */

const Piscina = require('piscina');
const path = require('path');
const os = require('os');

// 환경 변수 기본값
const MAX_THREADS = parseInt(process.env.CONVERTER_MAX_THREADS) || os.cpus().length;
const MIN_THREADS = parseInt(process.env.CONVERTER_MIN_THREADS) || 2;
const TIMEOUT = parseInt(process.env.CONVERTER_TIMEOUT) || 300000; // 5분

/**
 * Piscina 워커 풀 생성
 * - 워커 파일: utils/converters/converter.task.js
 * - 최소 스레드: MIN_THREADS (기본 2개)
 * - 최대 스레드: MAX_THREADS (CPU 코어 수)
 * - 타임아웃: TIMEOUT (기본 5분)
 */
const pool = new Piscina({
  filename: path.resolve(__dirname, 'converters/converter.task.js'),
  minThreads: MIN_THREADS,
  maxThreads: MAX_THREADS,
  idleTimeout: 30000,  // 30초 유휴 후 스레드 정리
  taskTimeout: TIMEOUT,
  concurrentTasksPerWorker: 1  // 워커당 1개 작업만 처리 (변환은 CPU 집약적)
});

/**
 * 변환 작업 실행
 * @param {Buffer|Array<Buffer>} fileBuffer - 파일 버퍼 (PDF 또는 Office 파일) 또는 PDF 버퍼 배열
 * @param {string} format - 변환 형식 (word, excel, ppt, jpg, png, word2pdf, excel2pdf, ppt2pdf, merge)
 * @param {Array<string>} fileNames - 파일명 배열 (merge 사용 시)
 * @returns {Promise<{success, buffer, format}>}
 */
async function convert(fileBuffer, format, fileNames = []) {
  try {
    console.log(`⏳ 워커 풀에 변환 작업 추가: ${format}`);

    let workerData;

    // PDF 병합인 경우
    if (format === 'merge') {
      workerData = { pdfBuffers: fileBuffer, fileNames, format };
    }
    // Office → PDF 변환인지 확인
    else if (format.endsWith('2pdf')) {
      workerData = { officeBuffer: fileBuffer, format };
    }
    // PDF → 다른 형식 변환
    else {
      workerData = { pdfBuffer: fileBuffer, format };
    }

    const result = await pool.run(workerData);

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log(`✅ 변환 완료: ${format}`);
    return result;
  } catch (error) {
    console.error(`❌ 변환 실패: ${format}`, error.message);
    throw error;
  }
}

/**
 * 워커 풀 상태 조회
 */
function getStats() {
  return {
    minThreads: MIN_THREADS,
    maxThreads: MAX_THREADS,
    taskTimeout: TIMEOUT,
    cpuCores: os.cpus().length
  };
}

/**
 * 워커 풀 종료 (graceful shutdown)
 */
async function destroy() {
  console.log('🛑 워커 풀 종료...');
  await pool.destroy();
  console.log('✅ 워커 풀 종료 완료');
}

module.exports = {
  pool,
  convert,
  getStats,
  destroy
};
