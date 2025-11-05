/**
 * ================================
 * 🎬 PDF → PowerPoint (.pptx) 변환
 * ================================
 * LibreOffice를 사용하여 PDF를 PowerPoint로 변환
 */

const libreofficeConvert = require('libreoffice-convert');
/**
 * PDF를 PowerPoint로 변환
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @returns {Promise<Buffer>} 변환된 PowerPoint 파일 버퍼
 */
async function convertPdfToPpt(pdfBuffer) {

  try {
    console.log(`🎬 PDF → PowerPoint 변환 시작`);

    // 2. LibreOffice로 변환
    console.log(`🔄 LibreOffice 변환 중...`);
    const convertedBuffer = await new Promise((resolve, reject) => {
      libreofficeConvert.convert(
        pdfBuffer,
        '.pptx',                      // format: 출력 확장자
        '',                          // filter: 빈 문자열로 LibreOffice 자동 선택
        (err, result) => {
          if (err) {
            console.error('❌ LibreOffice 변환 에러:', err);
            return reject(err);
          }

          console.log('✅ LibreOffice 변환 성공');
          resolve(result);
        }
      );
    });

    return convertedBuffer;
  } catch (error) {
    console.error('❌ PDF → PowerPoint 변환 실패:', error.message);
    throw new Error(`PDF → PowerPoint 변환 실패: ${error.message}`);
  }
}

module.exports = convertPdfToPpt;
