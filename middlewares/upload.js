const multer = require('multer');

/**
 * Multer 메모리 저장소 설정
 * - 파일을 메모리에 저장 (R2에 업로드하기 전까지)
 * - req.file.buffer에 접근 가능
 */
const upload = multer({
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
