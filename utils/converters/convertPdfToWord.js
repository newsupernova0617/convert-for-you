/**
 * ================================
 * 📄 PDF → Word (.docx) 변환
 * ================================
 * LibreOffice를 사용하여 PDF를 Word로 변환
 */

const libreofficeConvert = require('libreoffice-convert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');

// LibreOffice 변환 함수를 Promise로 변환
const convertAsync = promisify(libreofficeConvert.convert);

/**
 * PDF를 Word로 변환
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @returns {Promise<Buffer>} 변환된 Word 파일 버퍼
 */
async function convertPdfToWord(pdfBuffer) {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const tempInputPath = path.join(tempDir, `pdf-to-word-${timestamp}-input.pdf`);
  const tempOutputPath = path.join(tempDir, `pdf-to-word-${timestamp}-output.docx`);

  try {
    console.log(`📝 PDF → Word 변환 시작`);

    // 1. 임시 PDF 파일 저장
    console.log(`💾 임시 PDF 파일 저장: ${tempInputPath}`);
    await fs.writeFile(tempInputPath, pdfBuffer);

    // 2. LibreOffice로 변환
    console.log(`🔄 LibreOffice 변환 중...`);
    await new Promise((resolve, reject) => {
      libreofficeConvert.convert(
        tempInputPath,
        tempOutputPath,
        { filter: 'MS Word 2007 XML' },
        (err, result) => {
          if (err) {
            console.error('❌ LibreOffice 변환 에러:', err);
            reject(err);
          } else {
            console.log('✅ LibreOffice 변환 성공');
            resolve(result);
          }
        }
      );
    });

    // 3. 변환된 파일 읽기
    console.log(`📖 변환된 Word 파일 읽기`);
    const convertedBuffer = await fs.readFile(tempOutputPath);

    return convertedBuffer;
  } catch (error) {
    console.error('❌ PDF → Word 변환 실패:', error.message);
    throw new Error(`PDF → Word 변환 실패: ${error.message}`);
  } finally {
    // 4. 임시 파일 정리
    console.log(`🧹 임시 파일 정리`);
    try {
      await fs.unlink(tempInputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
    } catch (cleanupError) {
      console.warn('⚠️ 임시 파일 삭제 실패:', cleanupError.message);
    }
  }
}

module.exports = convertPdfToWord;
