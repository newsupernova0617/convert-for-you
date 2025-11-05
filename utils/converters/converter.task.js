/**
 * ================================
 * 🔄 Piscina 워커 파일
 * ================================
 * 별도 스레드에서 실행되는 PDF 변환 작업
 * Piscina가 호출할 핸들러 함수 내보내기
 */

const convertToWord = require('./convertPdfToWord');
const convertToExcel = require('./convertPdfToExcel');
const convertToPpt = require('./convertPdfToPpt');
const convertToImage = require('./convertPdfToImage');
const convertOfficeToPdf = require('./convertOfficeToPdf');
const { mergePdf } = require('./mergePdf');
const { splitPdf } = require('./splitPdf');
const { compressPdf } = require('./compressPdf');

/**
 * Piscina 핸들러 함수
 * @param {Object} data - { pdfBuffer: Buffer, format: string } 또는 { officeBuffer: Buffer, format: string } 또는 { pdfBuffers: Array<Buffer>, fileNames: Array<string>, format: string } 또는 { pdfBuffer: Buffer, ranges: Array, format: 'split' }
 * @returns {Promise<{success: boolean, buffer: Buffer, format: string}>}
 */
module.exports = async (data) => {
  try {
    const { pdfBuffer, officeBuffer, pdfBuffers, fileNames, ranges, quality, format } = data;

    console.log(`🔄 [워커 스레드] 변환 시작: ${format}`);

    let result;

    // 형식별 변환 함수 호출
    switch (format) {
      // PDF → Office/Image 변환
      case 'word':
        result = await convertToWord(pdfBuffer);
        break;

      case 'excel':
        result = await convertToExcel(pdfBuffer);
        break;

      case 'ppt':
        result = await convertToPpt(pdfBuffer);
        break;

      case 'jpg':
        result = await convertToImage(pdfBuffer, 'jpg');
        break;

      case 'png':
        result = await convertToImage(pdfBuffer, 'png');
        break;

      // Office → PDF 변환
      case 'word2pdf':
        result = await convertOfficeToPdf(officeBuffer, 'word');
        break;

      case 'excel2pdf':
        result = await convertOfficeToPdf(officeBuffer, 'excel');
        break;

      case 'ppt2pdf':
        result = await convertOfficeToPdf(officeBuffer, 'ppt');
        break;

      // PDF 병합
      case 'merge':
        result = await mergePdf(pdfBuffers, fileNames);
        break;

      // PDF 분할
      case 'split':
        result = await splitPdf(pdfBuffer, ranges);
        break;

      // PDF 압축
      case 'compress':
        result = await compressPdf(pdfBuffer, quality || 'medium');
        break;

      default:
        throw new Error(`지원하지 않는 형식: ${format}`);
    }

    // 변환 성공 반환
    console.log(`✅ [워커 스레드] 변환 완료: ${format}`);
    return {
      success: true,
      buffer: result,
      format: format
    };
  } catch (error) {
    // 변환 실패 반환
    console.error(`❌ [워커 스레드] 변환 실패:`, error.message);
    return {
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack,
      format: data?.format
    };
  }
};
