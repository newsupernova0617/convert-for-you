/**
 * ================================
 * 🎬➡️🎞️ Video to GIF Conversion
 * ================================
 * Converts video files to animated GIFs
 * Supports frame rate, duration, and quality control
 * Uses FFmpeg via fluent-ffmpeg
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

// Set FFmpeg path
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffmpeg-installer/ffmpeg').path.replace('ffmpeg', 'ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

/**
 * Convert video to GIF
 * @param {Buffer} videoBuffer - Input video buffer
 * @param {Object} options - {startTime: 0, duration: 10, fps: 10, quality: 'high'|'medium'|'low'}
 * @returns {Promise<Buffer>} GIF buffer
 */
async function videoToGif(videoBuffer, options = {}) {
  const {
    startTime = 0,
    duration = 10,
    fps = 10,
    quality = 'medium'
  } = options;

  const timestamp = Date.now();
  const inputPath = path.join(os.tmpdir(), `video-gif-input-${timestamp}.tmp`);
  const paletteDir = path.join(os.tmpdir(), `gif-palette-${timestamp}`);
  const palettePath = path.join(paletteDir, 'palette.png');
  const outputPath = path.join(os.tmpdir(), `video-gif-output-${timestamp}.gif`);

  try {
    // Write input buffer to temp file
    await writeFile(inputPath, videoBuffer);
    console.log(`📝 임시 비디오 파일 생성: ${inputPath}`);

    // Create palette directory
    if (!fs.existsSync(paletteDir)) {
      fs.mkdirSync(paletteDir, { recursive: true });
    }

    // Quality settings (colors and dithering)
    const qualitySettings = {
      'high': { colors: 256, dither: 'floyd_steinberg' },
      'medium': { colors: 128, dither: 'floyd_steinberg' },
      'low': { colors: 64, dither: 'bayer' }
    };

    const settings = qualitySettings[quality] || qualitySettings['medium'];

    // Step 1: Generate palette for better quality
    console.log('🎨 GIF 팔레트 생성 중...');
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(duration)
        .fps(fps)
        .output(palettePath)
        .outputOptions([
          '-vf',
          `scale='min(iw\,1024)':min'(ih\,1024)':force_original_aspect_ratio=decrease,split[s0][s1];[s0]palettegen=max_colors=${settings.colors}[p];[s1][p]paletteuse=dither=${settings.dither}`
        ])
        .on('end', () => {
          console.log('✅ 팔레트 생성 완료');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ 팔레트 생성 오류:', err.message);
          reject(err);
        })
        .run();
    });

    // Step 2: Create GIF using palette
    console.log('🎬 GIF 생성 중...');
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(duration)
        .fps(fps)
        .output(outputPath)
        .outputOptions([
          '-i', palettePath,
          '-filter_complex',
          `[0:v]scale='min(iw\,1024)':min'(ih\,1024)':force_original_aspect_ratio=decrease[v];[v][1:v]paletteuse=dither=${settings.dither}`,
          '-loop', '0'
        ])
        .on('end', () => {
          console.log('✅ GIF 생성 완료');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ GIF 생성 오류:', err.message);
          reject(err);
        })
        .run();
    });

    // Read converted file
    const result = await readFile(outputPath);
    console.log(`📊 생성된 GIF 크기: ${(result.length / 1024 / 1024).toFixed(2)} MB`);

    return result;
  } catch (error) {
    console.error('❌ GIF 변환 실패:', error.message);
    throw error;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) await unlink(inputPath);
      if (fs.existsSync(outputPath)) await unlink(outputPath);
      if (fs.existsSync(palettePath)) await unlink(palettePath);
      if (fs.existsSync(paletteDir)) {
        fs.rmdirSync(paletteDir, { recursive: true });
      }
      console.log('🧹 임시 GIF 파일 정리 완료');
    } catch (err) {
      console.warn('⚠️ 임시 파일 정리 중 오류:', err.message);
    }
  }
}

module.exports = {
  videoToGif
};
