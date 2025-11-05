const express = require('express');
const { downloadFromR2 } = require('../config/r2');
const db = require('../config/db');

const router = express.Router();

/**
 * GET /api/download/:fileId - 파일 다운로드 (R2에서)
 *
 * 요청: GET /api/download/1234567890-abc123
 * 응답: 파일 바이너리 데이터
 *
 * 동작:
 * 1. DB에서 파일 ID로 R2 경로 조회
 * 2. R2에서 파일 다운로드
 * 3. 클라이언트에게 다운로드 제공
 * 4. 파일 상태를 'deleted'로 변경 (스케줄러가 10분 후에 R2에서 실제 삭제)
 */
router.get('/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // DB에서 파일 정보 조회
    const stmt = db.prepare('SELECT * FROM files WHERE file_id = ? AND status = ?');
    const fileRecord = stmt.get(fileId, 'active');

    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      });
    }

    // R2에서 파일 다운로드
    console.log(`📥 R2에서 파일 다운로드: ${fileRecord.r2_path}`);
    const fileBuffer = await downloadFromR2(fileRecord.r2_path);

    // 파일명 추출 (R2 경로에서)
    const fileName = fileRecord.r2_path.substring(fileRecord.r2_path.lastIndexOf('/') + 1);

    // 클라이언트에게 파일 전송
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);

    console.log(`✅ 파일 다운로드 완료: ${fileName}`);
  } catch (error) {
    console.error('❌ 파일 다운로드 실패:', error);
    res.status(500).json({
      success: false,
      error: '파일 다운로드에 실패했습니다.'
    });
  }
});

module.exports = router;
