/**
 * ================================
 * PDF 병합 (Merge) 변환기
 * ================================
 * 여러 PDF를 하나로 병합
 * pdf-lib 라이브러리 사용
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 여러 PDF 파일을 병합
 * @param {Array<Buffer>} pdfBuffers - PDF 버퍼 배열
 * @param {Array<string>} fileNames - 파일명 배열 (로깅 용)
 * @returns {Promise<Buffer>} 병합된 PDF 버퍼
 */
async function mergePdf(pdfBuffers, fileNames = []) {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  try {
    console.log(`📄 PDF 병합 시작: ${fileNames.length}개 파일`);

    // 1️⃣ 새로운 PDF 문서 생성
    const mergedPdf = await PDFDocument.create();

    // 2️⃣ 각 PDF를 로드하고 페이지 복사
    for (let i = 0; i < pdfBuffers.length; i++) {
      const fileName = fileNames[i] || `파일${i + 1}`;

      try {
        const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
        const pageCount = pdfDoc.getPageCount();

        console.log(`  ✓ 로드: ${fileName} (${pageCount}페이지)`);

        // 해당 PDF의 모든 페이지를 복사
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        console.log(`  ✓ 추가: ${fileName} - ${pageCount}페이지 병합 완료`);
      } catch (error) {
        console.error(`  ✗ 오류: ${fileName} 처리 실패 - ${error.message}`);
        throw new Error(`"${fileName}" 로드 실패: ${error.message}`);
      }
    }

    // 3️⃣ 병합된 PDF를 버퍼로 변환
    const mergedPdfBytes = await mergedPdf.save();
    const mergedBuffer = Buffer.from(mergedPdfBytes);

    const totalPages = mergedPdf.getPageCount();
    console.log(`✅ PDF 병합 완료 (총 ${totalPages}페이지, ${(mergedBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    return mergedBuffer;
  } catch (error) {
    console.error(`❌ PDF 병합 실패: ${error.message}`);
    throw error;
  }
}

module.exports = { mergePdf };
