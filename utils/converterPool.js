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
 * @param {Buffer|Array<Buffer>} fileBuffer - 파일 버퍼
 * @param {string} format - 변환 형식
 * @param {any} additionalData - 추가 데이터 (merge: fileNames, split: ranges, compress: quality, image: options/quality/backgroundColor)
 * @returns {Promise<{success, buffer, format}>}
 */
async function convert(fileBuffer, format, additionalData = []) {
  try {
    console.log(`⏳ 워커 풀에 변환 작업 추가: ${format}`);

    let workerData;

    // PDF 병합
    if (format === 'merge') {
      workerData = { pdfBuffers: fileBuffer, fileNames: additionalData, format };
    }
    // PDF 분할
    else if (format === 'split') {
      workerData = { pdfBuffer: fileBuffer, ranges: additionalData, format };
    }
    // PDF 압축
    else if (format === 'compress') {
      workerData = { pdfBuffer: fileBuffer, quality: additionalData, format };
    }
    // Office → PDF
    else if (format.endsWith('2pdf')) {
      workerData = { officeBuffer: fileBuffer, format };
    }
    // 이미지 변환 (JPG/PNG/WEBP)
    else if (format.includes('to-')) {
      // 이미지 변환 형식 (jpg-to-png, png-to-jpg 등)
      const isQualityFormat = ['jpg-to-webp', 'png-to-webp', 'heic-to-jpg', 'heic-to-webp'].includes(format);
      const isBackgroundFormat = format === 'png-to-jpg';

      if (isQualityFormat) {
        workerData = { imageBuffer: fileBuffer, quality: additionalData, format };
      } else if (isBackgroundFormat) {
        workerData = { imageBuffer: fileBuffer, backgroundColor: additionalData, format };
      } else {
        workerData = { imageBuffer: fileBuffer, format };
      }
    }
    // 이미지 리사이즈/압축
    else if (format === 'resize' || format === 'compress-image') {
      workerData = { imageBuffer: fileBuffer, options: additionalData, format };
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
