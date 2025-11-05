/**
 * ================================
 * 이미지 변환기 (JPG/PNG/WEBP)
 * ================================
 * Sharp를 사용한 이미지 포맷 변환
 */

const sharp = require('sharp');

/**
 * JPG → PNG 변환
 * @param {Buffer} imageBuffer - JPG 이미지 버퍼
 * @returns {Promise<Buffer>} PNG 이미지 버퍼
 */
async function jpgToPng(imageBuffer) {
  try {
    console.log(`🎨 JPG → PNG 변환 중...`);

    const pngBuffer = await sharp(imageBuffer)
      .png({ compressionLevel: 9 })  // 최대 압축
      .toBuffer();

    console.log(`✅ JPG → PNG 변환 완료`);
    return pngBuffer;
  } catch (error) {
    console.error(`❌ JPG → PNG 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * PNG → JPG 변환
 * @param {Buffer} imageBuffer - PNG 이미지 버퍼
 * @param {string} backgroundColor - 배경색 (hex: #ffffff)
 * @returns {Promise<Buffer>} JPG 이미지 버퍼
 */
async function pngToJpg(imageBuffer, backgroundColor = '#ffffff') {
  try {
    console.log(`🎨 PNG → JPG 변환 중... (배경: ${backgroundColor})`);

    // 투명 배경을 지정된 색으로 변환
    const jpgBuffer = await sharp(imageBuffer)
      .flatten({ background: backgroundColor })  // 투명 배경 처리
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    console.log(`✅ PNG → JPG 변환 완료`);
    return jpgBuffer;
  } catch (error) {
    console.error(`❌ PNG → JPG 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * JPG → WEBP 변환
 * @param {Buffer} imageBuffer - JPG 이미지 버퍼
 * @param {number} quality - 품질 (1-100, 기본값 80)
 * @returns {Promise<Buffer>} WEBP 이미지 버퍼
 */
async function jpgToWebp(imageBuffer, quality = 80) {
  try {
    console.log(`🎨 JPG → WEBP 변환 중... (품질: ${quality})`);

    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: Math.min(Math.max(quality, 1), 100) })
      .toBuffer();

    console.log(`✅ JPG → WEBP 변환 완료`);
    return webpBuffer;
  } catch (error) {
    console.error(`❌ JPG → WEBP 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * PNG → WEBP 변환
 * @param {Buffer} imageBuffer - PNG 이미지 버퍼
 * @param {number} quality - 품질 (1-100, 기본값 80)
 * @returns {Promise<Buffer>} WEBP 이미지 버퍼
 */
async function pngToWebp(imageBuffer, quality = 80) {
  try {
    console.log(`🎨 PNG → WEBP 변환 중... (품질: ${quality})`);

    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: Math.min(Math.max(quality, 1), 100) })
      .toBuffer();

    console.log(`✅ PNG → WEBP 변환 완료`);
    return webpBuffer;
  } catch (error) {
    console.error(`❌ PNG → WEBP 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WEBP → JPG 변환
 * @param {Buffer} imageBuffer - WEBP 이미지 버퍼
 * @returns {Promise<Buffer>} JPG 이미지 버퍼
 */
async function webpToJpg(imageBuffer) {
  try {
    console.log(`🎨 WEBP → JPG 변환 중...`);

    const jpgBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    console.log(`✅ WEBP → JPG 변환 완료`);
    return jpgBuffer;
  } catch (error) {
    console.error(`❌ WEBP → JPG 변환 실패: ${error.message}`);
    throw error;
  }
}

/**
 * WEBP → PNG 변환
 * @param {Buffer} imageBuffer - WEBP 이미지 버퍼
 * @returns {Promise<Buffer>} PNG 이미지 버퍼
 */
async function webpToPng(imageBuffer) {
  try {
    console.log(`🎨 WEBP → PNG 변환 중...`);

    const pngBuffer = await sharp(imageBuffer)
      .png({ compressionLevel: 9 })
      .toBuffer();

    console.log(`✅ WEBP → PNG 변환 완료`);
    return pngBuffer;
  } catch (error) {
    console.error(`❌ WEBP → PNG 변환 실패: ${error.message}`);
    throw error;
  }
}

module.exports = {
  jpgToPng,
  pngToJpg,
  jpgToWebp,
  pngToWebp,
  webpToJpg,
  webpToPng
};
