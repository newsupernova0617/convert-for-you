/**
 * ================================
 * 📊 PDF → Excel (.xlsx) 변환
 * ================================
 * LibreOffice를 사용하여 PDF를 Excel로 변환
 */

const libreofficeConvert = require('libreoffice-convert');
/**
 * PDF를 Excel로 변환
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @returns {Promise<Buffer>} 변환된 Excel 파일 버퍼
 */
async function convertPdfToExcel(pdfBuffer) {

  try {
    console.log(`📊 PDF → Excel 변환 시작`);

    // 2. LibreOffice로 변환
    console.log(`🔄 LibreOffice 변환 중...`);
    const convertedBuffer = await new Promise((resolve, reject) => {
      libreofficeConvert.convert(
        pdfBuffer,
        '.xlsx',                      // format: 출력 확장자
        '',                          // filter: 빈 문자열로 LibreOffice 자동 선택
        (err, result) => {
          if (err) {
            const message = err.message || '';
            if (message.toLowerCase().includes('no export filter')) {
              const filterError = new Error('LibreOffice에서 PDF → Excel 내보내기 필터를 찾지 못했습니다.');
              filterError.code = 'LIBREOFFICE_NO_XLSX_FILTER';
              console.error('❌ LibreOffice 변환 에러:', filterError.message);
              return reject(filterError);
            }

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
    console.error('❌ PDF → Excel 변환 실패:', error.message);
    if (error.code === 'LIBREOFFICE_NO_XLSX_FILTER') {
      const wrapped = new Error('PDF → Excel 변환을 위한 LibreOffice Excel 필터가 설치되어 있지 않습니다.');
      wrapped.code = error.code;
      throw wrapped;
    }

    throw new Error(`PDF → Excel 변환 실패: ${error.message}`);
  }
}

module.exports = convertPdfToExcel;
