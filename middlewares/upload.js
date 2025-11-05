const multer = require('multer');

/**
 * Multer 메모리 저장소 설정
 * - 파일을 메모리에 저장 (R2에 업로드하기 전까지)
 * - req.file.buffer에 접근 가능 (단일 파일)
 * - req.files에 접근 가능 (다중 파일)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // PDF, Office, 이미지 파일 허용
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
      'image/heif'                    // .heif
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('PDF, Office 또는 이미지 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
});

// PDF 병합용 다중 파일 업로드 (최대 10개)
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // PDF 파일만 허용
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB 제한
});

module.exports = upload;
module.exports.uploadMultiple = uploadMultiple;
