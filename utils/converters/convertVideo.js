/**
 * ================================
 * 🎬 Video Format Conversion
 * ================================
 * Converts between video formats: MP4, MOV, AVI, MKV, WebM
 * Supports codec and resolution configuration
 * Uses FFmpeg via fluent-ffmpeg
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

// Set FFmpeg path
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// 정규식으로 파일명만 정확히 교체 (폴더명은 유지)
// /ffmpeg(\.exe)?$/ - 문자열 끝의 'ffmpeg' 또는 'ffmpeg.exe'만 매칭
const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

/**
 * Video format converter
 * @param {Buffer} videoBuffer - Input video buffer
 * @param {string} format - Target format: mp4, mov, avi, mkv, webm
 * @param {Object} options - {codec: 'h264'|'h265'|'vp8'|'vp9', bitrate: 5000, resolution: '1920x1080'|'1280x720'|'854x480'}
 * @returns {Promise<Buffer>} Converted video buffer
 */
async function convertVideo(videoBuffer, format, options = {}) {
  const {
    codec = 'h264',
    bitrate = 5000,
    resolution = '1920x1080'
  } = options;

  const timestamp = Date.now();
  const inputPath = path.join(os.tmpdir(), `video-input-${timestamp}.tmp`);
  const outputPath = path.join(os.tmpdir(), `video-output-${timestamp}.${format}`);

  try {
    // Write input buffer to temp file
    await writeFile(inputPath, videoBuffer);
    console.log(`📝 임시 비디오 파일 생성: ${inputPath}`);

    // Convert video using FFmpeg
    await new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Parse resolution
      const [width, height] = resolution.split('x').map(Number);

      // Video codec and bitrate settings
      switch (format) {
        case 'mp4':
          command
            .videoCodec(codec === 'h265' ? 'libx265' : 'libx264')
            .videoBitrate(bitrate)
            .audioCodec('aac')
            .audioBitrate(128)
            .size(`${width}x${height}`)
            .autopad();
          break;

        case 'mov':
          command
            .videoCodec(codec === 'h265' ? 'libx265' : 'libx264')
            .videoBitrate(bitrate)
            .audioCodec('aac')
            .audioBitrate(128)
            .size(`${width}x${height}`)
            .autopad();
          break;

        case 'avi':
          command
            .videoCodec('mpeg4')
            .videoBitrate(bitrate)
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .size(`${width}x${height}`)
            .autopad();
          break;

        case 'mkv':
          command
            .videoCodec(codec === 'vp9' ? 'libvpx-vp9' : 'libx264')
            .videoBitrate(bitrate)
            .audioCodec('aac')
            .audioBitrate(128)
            .size(`${width}x${height}`)
            .autopad();
          break;

        case 'webm':
          command
            .videoCodec(codec === 'vp9' ? 'libvpx-vp9' : 'libvpx')
            .videoBitrate(bitrate)
            .audioCodec('libopus')
            .audioBitrate(128)
            .size(`${width}x${height}`)
            .autopad();
          break;

        default:
          throw new Error(`지원하지 않는 비디오 형식: ${format}`);
      }

      command
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ 비디오 변환 완료: ${format}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ 비디오 변환 오류:`, err.message);
          reject(err);
        })
        .run();
    });

    // Read converted file
    const result = await readFile(outputPath);
    console.log(`📊 변환된 비디오 크기: ${(result.length / 1024 / 1024).toFixed(2)} MB`);

    return result;
  } catch (error) {
    console.error(`❌ 비디오 변환 실패:`, error.message);
    throw error;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) await unlink(inputPath);
      if (fs.existsSync(outputPath)) await unlink(outputPath);
      console.log('🧹 임시 비디오 파일 정리 완료');
    } catch (err) {
      console.warn('⚠️ 임시 파일 정리 중 오류:', err.message);
    }
  }
}

/**
 * Compress video with quality control
 * @param {Buffer} videoBuffer - Input video buffer
 * @param {string} quality - 'high' (8000kbps), 'medium' (5000kbps), 'low' (2500kbps)
 * @param {string} format - Output format (default: mp4)
 * @returns {Promise<Buffer>} Compressed video buffer
 */
async function compressVideo(videoBuffer, quality = 'medium', format = 'mp4') {
  const bitrateMap = {
    'high': 8000,
    'medium': 5000,
    'low': 2500
  };

  const bitrate = bitrateMap[quality] || 5000;

  return convertVideo(videoBuffer, format, {
    codec: 'h264',
    bitrate: bitrate,
    resolution: quality === 'low' ? '854x480' : quality === 'medium' ? '1280x720' : '1920x1080'
  });
}

/**
 * Get video metadata (duration, codec, bitrate, resolution, fps)
 * @param {Buffer} videoBuffer - Video buffer
 * @returns {Promise<Object>} Metadata object
 */
async function getVideoMetadata(videoBuffer) {
  const timestamp = Date.now();
  const inputPath = path.join(os.tmpdir(), `video-metadata-${timestamp}.tmp`);

  try {
    await writeFile(inputPath, videoBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

          // Parse frame rate
          let fps = 30;
          if (videoStream?.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
            fps = num / den;
          }

          resolve({
            duration: metadata.format.duration,
            bitrate: metadata.format.bit_rate,
            videoCodec: videoStream?.codec_name || 'unknown',
            audioCodec: audioStream?.codec_name || 'unknown',
            width: videoStream?.width || 1920,
            height: videoStream?.height || 1080,
            fps: fps,
            audioChannels: audioStream?.channels || 2
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ 메타데이터 조회 실패:', error.message);
    throw error;
  } finally {
    try {
      if (fs.existsSync(inputPath)) await unlink(inputPath);
    } catch (err) {
      console.warn('⚠️ 메타데이터 임시 파일 정리 실패:', err.message);
    }
  }
}

module.exports = {
  convertVideo,
  compressVideo,
  getVideoMetadata
};
