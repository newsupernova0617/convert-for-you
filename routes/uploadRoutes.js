const express = require('express');
const upload = require('../middlewares/upload');
const { uploadToR2, generateR2Path } = require('../config/r2');
const { withTime } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/upload - 파일 업로드 (R2로 저장)
 *
 * 요청: multipart/form-data with 'file' field
 * 응답: { success: true, fileName: "...", r2Path: "...", size: ... }
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'PDF 파일이 없습니다.'
      });
    }

    // R2 저장 경로 생성
    const r2Path = generateR2Path(req.file.originalname, 'uploads');

    // R2에 파일 업로드
    const uploadResult = await uploadToR2(r2Path, req.file.buffer, 'application/pdf');

    res.json({
      success: true,
      fileName: req.file.originalname,
      r2Path: r2Path,
      size: req.file.size,
      url: uploadResult.url
    });
  } catch (error) {
    console.error(withTime('❌ 파일 업로드 실패:'), error);
    res.status(500).json({
      success: false,
      error: '파일 업로드에 실패했습니다.'
    });
  }
});

module.exports = router;
