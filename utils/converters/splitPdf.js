/**
 * ================================
 * PDF 분할 (Split) 변환기
 * ================================
 * PDF를 특정 페이지 범위로 분할
 * pdf-lib 라이브러리 사용
 */

const { PDFDocument } = require('pdf-lib');
const archiver = require('archiver');
const { Writable } = require('stream');

/**
 * PDF를 페이지 범위로 분할
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {Array<{start: number, end: number}>} ranges - 분할 범위 배열 (1-indexed)
 *                                                       예: [{start: 1, end: 5}, {start: 6, end: 10}]
 * @returns {Promise<Buffer>} ZIP 아카이브 버퍼 (분할된 PDF들)
 */
async function splitPdf(pdfBuffer, ranges = []) {
  try {
    console.log(`📄 PDF 분할 시작: ${ranges.length}개 범위`);

    // 원본 PDF 로드
    const originalPdf = await PDFDocument.load(pdfBuffer);
    const totalPages = originalPdf.getPageCount();

    console.log(`  📊 원본 PDF: ${totalPages}페이지`);

    // 범위 검증
    if (!ranges || ranges.length === 0) {
      throw new Error('분할 범위가 지정되지 않았습니다.');
    }

    // 유효한 범위만 필터링
    const validRanges = [];
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const start = Math.max(1, Math.min(range.start, totalPages));
      const end = Math.max(1, Math.min(range.end, totalPages));

      if (start <= end) {
        validRanges.push({ start, end, original: range });
        console.log(`  ✓ 범위 ${i + 1}: ${start}-${end}페이지`);
      }
    }

    if (validRanges.length === 0) {
      throw new Error('유효한 분할 범위가 없습니다.');
    }

    // 각 범위별로 PDF 생성
    const splitPdfs = [];
    for (let i = 0; i < validRanges.length; i++) {
      const range = validRanges[i];
      const startIdx = range.start - 1;
      const endIdx = range.end;

      // 새 PDF 문서 생성
      const newPdf = await PDFDocument.create();

      // 해당 범위의 페이지 복사
      const pageIndices = [];
      for (let j = startIdx; j < endIdx; j++) {
        pageIndices.push(j);
      }

      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      splitPdfs.push({
        fileName: `split_${String(i + 1).padStart(3, '0')}_${range.start}-${range.end}.pdf`,
        buffer: Buffer.from(pdfBytes),
        pages: pageIndices.length
      });

      console.log(`  ✅ 분할 PDF ${i + 1} 생성: ${pageIndices.length}페이지`);
    }

    // ZIP 아카이브 생성
    console.log(`\n📦 ZIP 아카이브 생성 중...`);
    const zipBuffer = await createZipFromPdfs(splitPdfs);

    console.log(`✅ PDF 분할 완료 (${splitPdfs.length}개 파일, ${(zipBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    return zipBuffer;
  } catch (error) {
    console.error(`❌ PDF 분할 실패: ${error.message}`);
    throw error;
  }
}

/**
 * PDF 버퍼 배열을 ZIP 아카이브로 생성
 * @param {Array<{fileName, buffer}>} pdfs - PDF 정보 배열
 * @returns {Promise<Buffer>} ZIP 아카이브 버퍼
 */
async function createZipFromPdfs(pdfs) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    const archive = archiver('zip', {
      zlib: { level: 9 } // 최대 압축
    });

    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.on('end', () => {
      const zipBuffer = Buffer.concat(chunks);
      console.log(`  ✅ ZIP 생성 완료 (${(zipBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
      resolve(zipBuffer);
    });

    archive.on('error', (error) => {
      console.error(`  ✗ ZIP 생성 오류:`, error.message);
      reject(error);
    });

    // 각 PDF를 ZIP에 추가
    for (let pdf of pdfs) {
      console.log(`  📝 추가: ${pdf.fileName}`);
      archive.append(pdf.buffer, { name: pdf.fileName });
    }

    archive.finalize();
  });
}

module.exports = { splitPdf };
