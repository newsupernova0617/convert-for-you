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
const { jpgToPng, pngToJpg, jpgToWebp, pngToWebp, webpToJpg, webpToPng } = require('./convertImage');
const { heicToJpg, heicToPng, heicToWebp } = require('./convertHeic');
const { resizeImage, compressImageOnly } = require('./resizeImage');
const { convertAudio } = require('./convertAudio');
const { convertVideo, compressVideo } = require('./convertVideo');
const { videoToGif } = require('./convertVideoToGif');

/**
 * Piscina 핸들러 함수
 * @param {Object} data - { pdfBuffer: Buffer, format: string } 또는 { officeBuffer: Buffer, format: string } 또는 { pdfBuffers: Array<Buffer>, fileNames: Array<string>, format: string } 또는 { pdfBuffer: Buffer, ranges: Array, format: 'split' }
 * @returns {Promise<{success: boolean, buffer: Buffer, format: string}>}
 */
module.exports = async (data) => {
  try {
    const { pdfBuffer, officeBuffer, pdfBuffers, fileNames, ranges, quality, format, imageBuffer, options, backgroundColor, audioBuffer, videoBuffer, bitrate, videoOptions, gifOptions } = data;

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

      // 이미지 변환 (JPG/PNG/WEBP)
      case 'jpg-to-png':
        result = await jpgToPng(imageBuffer);
        break;

      case 'png-to-jpg':
        result = await pngToJpg(imageBuffer, backgroundColor || '#ffffff');
        break;

      case 'jpg-to-webp':
        result = await jpgToWebp(imageBuffer, quality || 80);
        break;

      case 'png-to-webp':
        result = await pngToWebp(imageBuffer, quality || 80);
        break;

      case 'webp-to-jpg':
        result = await webpToJpg(imageBuffer);
        break;

      case 'webp-to-png':
        result = await webpToPng(imageBuffer);
        break;

      // HEIC 변환
      case 'heic-to-jpg':
        result = await heicToJpg(imageBuffer, quality || 90);
        break;

      case 'heic-to-png':
        result = await heicToPng(imageBuffer);
        break;

      case 'heic-to-webp':
        result = await heicToWebp(imageBuffer, quality || 80);
        break;

      // 이미지 리사이즈
      case 'resize':
        result = await resizeImage(imageBuffer, options);
        break;

      // 이미지 압축
      case 'compress-image':
        result = await compressImageOnly(imageBuffer, options);
        break;

      // 음성 변환 (MP3, WAV, OGG, M4A, AAC)
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
      case 'aac':
        result = await convertAudio(audioBuffer, format, bitrate || 192);
        break;

      // 비디오 변환 (MP4, MOV, WebM, MKV)
      case 'mp4':
      case 'mov':
      case 'webm':
      case 'mkv':
        result = await convertVideo(videoBuffer, format, videoOptions || {});
        break;

      // 비디오 압축
      case 'compress-video':
        result = await compressVideo(videoBuffer, quality || 'medium', 'mp4');
        break;

      // 비디오 → GIF
      case 'gif':
        result = await videoToGif(videoBuffer, gifOptions || {});
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
