const multer = require('multer');
const FileType = require('file-type');

/**
 * 파일 타입 검증 (Magic Number 확인)
 * MIME type 스푸핑 방지
 */
const validateFileType = async (buffer, mimeType) => {
  const allowedMimes = {
    // PDF
    'application/pdf': ['pdf'],
    // Office
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
    'application/msword': ['doc'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.ms-powerpoint': ['ppt'],
    // Images
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/heic': ['heic'],
    'image/heif': ['heif'],
    // Audio
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/ogg': ['ogg'],
    'audio/x-m4a': ['m4a'],
    'audio/aac': ['aac'],
    'audio/x-flac': ['flac'],
    'audio/x-ms-wma': ['wma'],
    // Video
    'video/mp4': ['mp4'],
    'video/quicktime': ['mov'],
    'video/x-msvideo': ['avi'],
    'video/x-matroska': ['mkv'],
    'video/webm': ['webm'],
    'video/x-flv': ['flv'],
    'video/x-ms-wmv': ['wmv']
  };

  try {
    // 실제 파일 타입 확인 (magic number)
    const fileType = await FileType.fromBuffer(buffer);

    if (!fileType) {
      return { valid: false, error: '파일 타입을 확인할 수 없습니다' };
    }

    // 선언된 MIME type과 실제 MIME type 비교
    if (fileType.mime !== mimeType) {
      return {
        valid: false,
        error: `파일 타입이 일치하지 않습니다. 선언: ${mimeType}, 실제: ${fileType.mime}`
      };
    }

    // 추가 검증: 확장자 확인
    const expectedExts = allowedMimes[mimeType];
    if (expectedExts && !expectedExts.includes(fileType.ext)) {
      return {
        valid: false,
        error: `파일 확장자가 일치하지 않습니다`
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: '파일 타입 검증 실패: ' + error.message };
  }
};

/**
 * Multer 메모리 저장소 설정
 * - 파일을 메모리에 저장 (R2에 업로드하기 전까지)
 * - req.file.buffer에 접근 가능 (단일 파일)
 * - req.files에 접근 가능 (다중 파일)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: async (req, file, cb) => {
    // PDF, Office, 이미지, 음성, 비디오 파일 허용
    const allowedMimeTypes = [
      // PDF
      'application/pdf',
      // Office
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword',           // .doc
      'application/vnd.ms-excel',     // .xls
      'application/vnd.ms-powerpoint', // .ppt
      // Images
      'image/jpeg',                   // .jpg, .jpeg
      'image/png',                    // .png
      'image/webp',                   // .webp
      'image/heic',                   // .heic
      'image/heif',                   // .heif
      // Audio
      'audio/mpeg',                   // .mp3
      'audio/wav',                    // .wav
      'audio/ogg',                    // .ogg
      'audio/x-m4a',                  // .m4a
      'audio/aac',                    // .aac
      'audio/x-flac',                 // .flac
      'audio/x-ms-wma',               // .wma
      // Video
      'video/mp4',                    // .mp4
      'video/quicktime',              // .mov
      'video/x-msvideo',              // .avi
      'video/x-matroska',             // .mkv
      'video/webm',                   // .webm
      'video/x-flv',                  // .flv
      'video/x-ms-wmv'                // .wmv
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('지원하지 않는 파일 형식입니다'));
    }

    // Magic number로 파일 타입 검증
    if (req.file && req.file.buffer) {
      const validation = await validateFileType(req.file.buffer, file.mimetype);
      if (!validation.valid) {
        return cb(new Error(validation.error));
      }
    }

    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
});

// PDF 병합용 다중 파일 업로드 (최대 10개)
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  fileFilter: async (req, file, cb) => {
    // PDF 파일만 허용
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('PDF 파일만 업로드 가능합니다'));
    }

    // PDF magic number 검증
    if (req.file && req.file.buffer) {
      const validation = await validateFileType(req.file.buffer, 'application/pdf');
      if (!validation.valid) {
        return cb(new Error(validation.error));
      }
    }

    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
});

module.exports = upload;
module.exports.uploadMultiple = uploadMultiple;
