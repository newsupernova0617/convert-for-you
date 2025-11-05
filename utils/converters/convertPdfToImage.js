/**
 * ================================
 * 🖼️ PDF → Image (JPG/PNG) 변환
 * ================================
 * LibreOffice를 사용하여 PDF를 이미지로 변환
 * 첫 번째 페이지만 변환 (여러 페이지 필요시 추가 로직 필요)
 */

const libreofficeConvert = require('libreoffice-convert');
const sharp = require('sharp');

/**
 * PDF를 이미지로 변환 (JPG 또는 PNG)
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @param {string} format - 변환 형식 ('jpg' 또는 'png')
 * @returns {Promise<Buffer>} 변환된 이미지 파일 버퍼
 */
async function convertPdfToImage(pdfBuffer, format) {

  try {
    console.log(`🖼️ PDF → ${format.toUpperCase()} 변환 시작`);

    // 2. LibreOffice로 PDF를 PNG로 변환
    console.log(`🔄 LibreOffice 변환 중... (PNG)`);
    let imageBuffer = await new Promise((resolve, reject) => {
      libreofficeConvert.convert(
        pdfBuffer,
        '.png',                      // format: 출력 확장자
        '',                          // filter: 빈 문자열로 LibreOffice 자동 선택
        (err, result) => {
          if (err) {
            console.error('❌ LibreOffice 변환 에러:', err);
            return reject(err);
          }

          console.log('✅ LibreOffice 변환 성공 (PNG)');
          resolve(result);
        }
      );
    });

    // 4. 필요시 JPG로 변환 및 최적화
    if (format === 'jpg') {
      console.log(`🎨 PNG → JPG 변환 (Sharp 사용)`);
      imageBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();
    } else if (format === 'png') {
      // PNG 최적화
      console.log(`🎨 PNG 최적화 (Sharp 사용)`);
      imageBuffer = await sharp(imageBuffer)
        .png({ compressionLevel: 9 })
        .toBuffer();
    }

    console.log(`✅ 이미지 변환 완료: ${format.toUpperCase()}`);
    return imageBuffer;
  } catch (error) {
    console.error(`❌ PDF → ${format.toUpperCase()} 변환 실패:`, error.message);
    throw new Error(`PDF → ${format.toUpperCase()} 변환 실패: ${error.message}`);
  }
}

module.exports = convertPdfToImage;
