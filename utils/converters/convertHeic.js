/**
 * ================================
 * HEIC/HEIF 변환기
 * ================================
 * HEIC (Apple) → JPG/PNG 변환
 * heic-convert 라이브러리 사용
 */

const convert = require('heic-convert');
const sharp = require('sharp');

/**
 * HEIC → JPG 변환
 * @param {Buffer} heicBuffer - HEIC 이미지 버퍼
 * @param {number} quality - JPG 품질 (1-100, 기본값 90)
 * @returns {Promise<Buffer>} JPG 이미지 버퍼
 */
async function heicToJpg(heicBuffer, quality = 90) {
  try {
    console.log(`🎨 HEIC → JPG 변환 중... (품질: ${quality})`);

    // HEIC → JPEG 바이너리 변환
    const jpegBuffer = await convert({
      blob: heicBuffer,
      toType: 'image/jpeg',
      quality: Math.min(Math.max(quality, 1), 100) / 100  // 0-1 범위로 변환
    });

    console.log(`✅ HEIC → JPG 변환 완료`);
    return Buffer.from(jpegBuffer);
  } catch (error) {
    console.error(`❌ HEIC → JPG 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * HEIC → PNG 변환
 * @param {Buffer} heicBuffer - HEIC 이미지 버퍼
 * @returns {Promise<Buffer>} PNG 이미지 버퍼
 */
async function heicToPng(heicBuffer) {
  try {
    console.log(`🎨 HEIC → PNG 변환 중...`);

    // HEIC → JPEG 먼저 변환 (heic-convert는 PNG를 직접 지원하지 않음)
    const jpegBuffer = await convert({
      blob: heicBuffer,
      toType: 'image/jpeg',
      quality: 0.95
    });

    // JPEG → PNG 변환
    const pngBuffer = await sharp(Buffer.from(jpegBuffer))
      .png({ compressionLevel: 9 })
      .toBuffer();

    console.log(`✅ HEIC → PNG 변환 완료`);
    return pngBuffer;
  } catch (error) {
    console.error(`❌ HEIC → PNG 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * HEIC → WEBP 변환
 * @param {Buffer} heicBuffer - HEIC 이미지 버퍼
 * @param {number} quality - WEBP 품질 (1-100, 기본값 80)
 * @returns {Promise<Buffer>} WEBP 이미지 버퍼
 */
async function heicToWebp(heicBuffer, quality = 80) {
  try {
    console.log(`🎨 HEIC → WEBP 변환 중... (품질: ${quality})`);

    // HEIC → JPEG 먼저 변환
    const jpegBuffer = await convert({
      blob: heicBuffer,
      toType: 'image/jpeg',
      quality: 0.95
    });

    // JPEG → WEBP 변환
    const webpBuffer = await sharp(Buffer.from(jpegBuffer))
      .webp({ quality: Math.min(Math.max(quality, 1), 100) })
      .toBuffer();

    console.log(`✅ HEIC → WEBP 변환 완료`);
    return webpBuffer;
  } catch (error) {
    console.error(`❌ HEIC → WEBP 변환 실패: ${error.message}`);
    throw error;
  }
}

module.exports = {
  heicToJpg,
  heicToPng,
  heicToWebp
};
