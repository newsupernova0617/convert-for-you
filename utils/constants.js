const path = require('path');
require('dotenv').config();

// 포트 설정
const PORT = process.env.PORT || 3002;

// Node 환경
const NODE_ENV = process.env.NODE_ENV || 'development';

// 업로드 디렉토리 경로
const UPLOAD_DIR = path.join(__dirname, '../' + (process.env.UPLOAD_DIR || 'uploads'));

// 파일 크기 제한 (기본값: 50MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024;

// 지원하는 파일 형식 맵
const EXTENSION_MAP = {
  // PDF → Office/Image
  'word': '.docx',
  'excel': '.xlsx',
  'ppt': '.pptx',
  'jpg': '.zip',
  'png': '.zip',
  // Office → PDF
  'word2pdf': '.pdf',
  'excel2pdf': '.pdf',
  'ppt2pdf': '.pdf',
  // PDF 병합/분할/압축
  'merge': '.pdf',
  'split': '.zip',
  'compress': '.pdf',
  // 이미지 변환
  'jpg-to-png': '.png',
  'png-to-jpg': '.jpg',
  'jpg-to-webp': '.webp',
  'png-to-webp': '.webp',
  'webp-to-jpg': '.jpg',
  'webp-to-png': '.png',
  'heic-to-jpg': '.jpg',
  'heic-to-png': '.png',
  'heic-to-webp': '.webp',
  'resize': '.resized',  // 원본 포맷 유지
  'compress-image': '.compressed',  // 원본 포맷 유지
  // 음성 변환
  'mp3': '.mp3',
  'wav': '.wav',
  'ogg': '.ogg',
  'm4a': '.m4a',
  'aac': '.aac',
  // 비디오 변환
  'mp4': '.mp4',
  'mov': '.mov',
  'webm': '.webm',
  'mkv': '.mkv',
  'compress-video': '.mp4',
  'gif': '.gif'
};

// 변환 시뮬레이션 시간 (ms)
const CONVERSION_DELAY = parseInt(process.env.CONVERSION_DELAY) || 2000;

// Google AdSense Publisher ID
const ADSENSE_PUBLISHER_ID = process.env.ADSENSE_PUBLISHER_ID || 'ca-pub-xxxxxxxxxxxxxxxx';

// 데이터베이스 경로
const DB_PATH = path.join(__dirname, '../' + (process.env.DB_PATH || 'config/app.db'));

module.exports = {
  PORT,
  NODE_ENV,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  EXTENSION_MAP,
  CONVERSION_DELAY,
  ADSENSE_PUBLISHER_ID,
  DB_PATH
};
