/**
 * ================================
 * 🎵 Audio Format Conversion
 * ================================
 * Converts between audio formats: MP3, WAV, OGG, M4A, AAC
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
 * Audio format converter
 * @param {Buffer} audioBuffer - Input audio buffer
 * @param {string} format - Target format: mp3, wav, ogg, m4a, aac
 * @param {number} bitrate - Bitrate in kbps (default 192)
 * @returns {Promise<Buffer>} Converted audio buffer
 */
async function convertAudio(audioBuffer, format, bitrate = 192) {
  const timestamp = Date.now();
  const inputPath = path.join(os.tmpdir(), `audio-input-${timestamp}.tmp`);
  const outputPath = path.join(os.tmpdir(), `audio-output-${timestamp}.${format}`);

  try {
    // Write input buffer to temp file
    await writeFile(inputPath, audioBuffer);
    console.log(`📝 임시 음성 파일 생성: ${inputPath}`);

    // Convert audio using FFmpeg
    await new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Format-specific settings
      switch (format) {
        case 'mp3':
          command
            .audioCodec('libmp3lame')
            .audioBitrate(`${Math.min(bitrate, 320)}k`)
            .audioChannels(2)
            .audioFrequency(44100);
          break;

        case 'wav':
          command
            .audioCodec('pcm_s16le')
            .audioChannels(2)
            .audioFrequency(44100);
          break;

        case 'ogg':
          command
            .audioCodec('libvorbis')
            .audioBitrate(`${Math.min(bitrate, 320)}k`)
            .audioChannels(2)
            .audioFrequency(44100);
          break;

        case 'm4a':
          command
            .audioCodec('aac')
            .audioBitrate(`${Math.min(bitrate, 320)}k`)
            .audioChannels(2)
            .audioFrequency(44100);
          break;

        case 'aac':
          command
            .audioCodec('aac')
            .audioBitrate(`${Math.min(bitrate, 320)}k`)
            .audioChannels(2)
            .audioFrequency(44100);
          break;

        default:
          throw new Error(`지원하지 않는 음성 형식: ${format}`);
      }

      command
        .output(outputPath)
        .on('end', () => {
          console.log(`✅ 음성 변환 완료: ${format}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ 음성 변환 오류:`, err.message);
          reject(err);
        })
        .run();
    });

    // Read converted file
    const result = await readFile(outputPath);
    console.log(`📊 변환된 음성 크기: ${(result.length / 1024 / 1024).toFixed(2)} MB`);

    return result;
  } catch (error) {
    console.error(`❌ 음성 변환 실패:`, error.message);
    throw error;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) await unlink(inputPath);
      if (fs.existsSync(outputPath)) await unlink(outputPath);
      console.log('🧹 임시 음성 파일 정리 완료');
    } catch (err) {
      console.warn('⚠️ 임시 파일 정리 중 오류:', err.message);
    }
  }
}

/**
 * Get audio metadata (duration, codec, bitrate, channels)
 * @param {Buffer} audioBuffer - Audio buffer
 * @returns {Promise<Object>} Metadata object
 */
async function getAudioMetadata(audioBuffer) {
  const timestamp = Date.now();
  const inputPath = path.join(os.tmpdir(), `audio-metadata-${timestamp}.tmp`);

  try {
    await writeFile(inputPath, audioBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
          resolve({
            duration: metadata.format.duration,
            bitrate: metadata.format.bit_rate,
            codec: audioStream?.codec_name || 'unknown',
            channels: audioStream?.channels || 2,
            sampleRate: audioStream?.sample_rate || 44100
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
  convertAudio,
  getAudioMetadata
};
