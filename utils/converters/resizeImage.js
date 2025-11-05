/**
 * ================================
 * 이미지 리사이즈 & 압축
 * ================================
 * Sharp를 사용한 이미지 크기 조정 및 압축
 */

const sharp = require('sharp');

/**
 * 이미지 리사이즈 및 압축
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {Object} options - 옵션 {
 *   width: number,           // 너비 (픽셀)
 *   height: number,          // 높이 (픽셀)
 *   fit: 'cover'|'contain'|'fill'|'inside'|'outside',  // 맞춤 방식
 *   quality: 1-100,          // 품질 (JPG/WEBP)
 *   format: 'jpeg'|'png'|'webp'  // 출력 포맷
 * }
 * @returns {Promise<Buffer>} 리사이즈된 이미지 버퍼
 */
async function resizeImage(imageBuffer, options = {}) {
  try {
    const {
      width,
      height,
      fit = 'cover',
      quality = 80,
      format = 'jpeg'
    } = options;

    console.log(`🖼️ 이미지 리사이즈 시작`);
    console.log(`  크기: ${width}x${height}, 방식: ${fit}, 품질: ${quality}`);

    // 이미지 메타데이터 가져오기
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`  원본: ${metadata.width}x${metadata.height} (${metadata.format})`);

    let transform = sharp(imageBuffer).resize(width, height, {
      fit: fit,
      position: 'center'
    });

    // 포맷별 처리
    let resizedBuffer;
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        resizedBuffer = await transform
          .jpeg({ quality: Math.min(Math.max(quality, 1), 100), progressive: true })
          .toBuffer();
        break;
      case 'png':
        resizedBuffer = await transform
          .png({ compressionLevel: 9 })
          .toBuffer();
        break;
      case 'webp':
        resizedBuffer = await transform
          .webp({ quality: Math.min(Math.max(quality, 1), 100) })
          .toBuffer();
        break;
      default:
        resizedBuffer = await transform
          .jpeg({ quality: Math.min(Math.max(quality, 1), 100), progressive: true })
          .toBuffer();
    }

    const originalSize = imageBuffer.length / 1024 / 1024;
    const resizedSize = resizedBuffer.length / 1024 / 1024;
    const sizeReduction = ((1 - resizedBuffer.length / imageBuffer.length) * 100).toFixed(1);

    console.log(`✅ 이미지 리사이즈 완료`);
    console.log(`  결과: ${width}x${height} (${format})`);
    console.log(`  크기: ${originalSize.toFixed(2)}MB → ${resizedSize.toFixed(2)}MB (-${sizeReduction}%)`);

    return resizedBuffer;
  } catch (error) {
    console.error(`❌ 이미지 리사이즈 실패: ${error.message}`);
    throw error;
  }
}

/**
 * 이미지 크기만 조정 (리사이즈 없음)
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {Object} options - {width, height, fit}
 * @returns {Promise<Buffer>} 리사이즈된 이미지
 */
async function resizeImageOnly(imageBuffer, options = {}) {
  return resizeImage(imageBuffer, { ...options, quality: 100, format: 'png' });
}

/**
 * 이미지 압축만 (크기 유지)
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {Object} options - {quality, format}
 * @returns {Promise<Buffer>} 압축된 이미지
 */
async function compressImageOnly(imageBuffer, options = {}) {
  try {
    const {
      quality = 80,
      format = 'jpeg'
    } = options;

    console.log(`🗜️ 이미지 압축 중... (품질: ${quality})`);

    let compressedBuffer;
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        compressedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: Math.min(Math.max(quality, 1), 100), progressive: true })
          .toBuffer();
        break;
      case 'png':
        compressedBuffer = await sharp(imageBuffer)
          .png({ compressionLevel: 9 })
          .toBuffer();
        break;
      case 'webp':
        compressedBuffer = await sharp(imageBuffer)
          .webp({ quality: Math.min(Math.max(quality, 1), 100) })
          .toBuffer();
        break;
      default:
        compressedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: Math.min(Math.max(quality, 1), 100), progressive: true })
          .toBuffer();
    }

    const originalSize = imageBuffer.length / 1024 / 1024;
    const compressedSize = compressedBuffer.length / 1024 / 1024;
    const sizeReduction = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1);

    console.log(`✅ 이미지 압축 완료`);
    console.log(`  크기: ${originalSize.toFixed(2)}MB → ${compressedSize.toFixed(2)}MB (-${sizeReduction}%)`);

    return compressedBuffer;
  } catch (error) {
    console.error(`❌ 이미지 압축 실패: ${error.message}`);
    throw error;
  }
}

module.exports = {
  resizeImage,
  resizeImageOnly,
  compressImageOnly
};
