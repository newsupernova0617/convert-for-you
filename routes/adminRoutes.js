const express = require('express');
const router = express.Router();
const { withTime } = require('../utils/logger');
const { login, verifyToken, refreshToken } = require('../config/auth');
const { loginLimiter } = require('../config/rateLimiter');
const {
  getConversionStats,
  getFormatStats,
  getHourlyStats,
  getFilesList,
  getFileById,
  getSystemStatus,
  getDeletedFiles
} = require('../utils/dashboard');
const { deleteFromR2 } = require('../config/r2');
const db = require('../config/db');

/**
 * POST /api/admin/login
 * 관리자 로그인 - 비밀번호로 JWT 토큰 발급
 * Rate Limiting: 15분 내 5회 이상 시도 시 차단
 */
router.post('/login', loginLimiter, (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: '비밀번호를 입력하세요.' });
    }

    const result = login(password);
    if (!result.success) {
      console.log(withTime(`⚠️  관리자 로그인 실패: 잘못된 비밀번호`));
      return res.status(401).json(result);
    }

    console.log(withTime(`✅ 관리자 로그인 성공`));
    res.json(result);
  } catch (error) {
    console.error(withTime(`❌ 로그인 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/admin/refresh
 * JWT 토큰 새로고침
 */
router.post('/refresh', verifyToken, (req, res) => {
  try {
    refreshToken(req, res);
  } catch (error) {
    console.error(withTime(`❌ 토큰 새로고침 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '토큰 새로고침 실패' });
  }
});

/**
 * GET /api/admin/stats
 * 변환 통계 조회
 */
router.get('/stats', verifyToken, (req, res) => {
  try {
    const conversionStats = getConversionStats();
    const formatStats = getFormatStats();
    const hourlyStats = getHourlyStats();

    res.json({
      success: true,
      conversions: conversionStats,
      formats: formatStats,
      hourly: hourlyStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(withTime(`❌ 통계 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '통계 조회 실패' });
  }
});

/**
 * GET /api/admin/files
 * 파일 목록 조회 (페이지네이션)
 */
router.get('/files', verifyToken, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = getFilesList(page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(withTime(`❌ 파일 목록 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '파일 목록 조회 실패' });
  }
});

/**
 * GET /api/admin/files/:fileId
 * 특정 파일 정보 조회
 */
router.get('/files/:fileId', verifyToken, (req, res) => {
  try {
    const { fileId } = req.params;
    const file = getFileById(fileId);

    if (!file) {
      return res.status(404).json({ success: false, error: '파일을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: file });
  } catch (error) {
    console.error(withTime(`❌ 파일 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '파일 조회 실패' });
  }
});

/**
 * DELETE /api/admin/files/:fileId
 * 파일 수동 삭제
 */
router.delete('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = getFileById(fileId);

    if (!file) {
      return res.status(404).json({ success: false, error: '파일을 찾을 수 없습니다.' });
    }

    // R2에서 파일 삭제
    try {
      await deleteFromR2(file.r2Path);
      console.log(withTime(`🗑️  R2에서 파일 삭제: ${file.r2Path}`));
    } catch (r2Error) {
      console.warn(withTime(`⚠️  R2 삭제 실패: ${r2Error.message}`));
      // R2 삭제 실패해도 DB는 업데이트함
    }

    // DB 상태 업데이트
    const stmt = db.prepare(
      `UPDATE files SET status='deleted', deleted_at=CURRENT_TIMESTAMP WHERE file_id=?`
    );
    stmt.run(fileId);

    console.log(withTime(`✅ 파일 삭제 완료: ${fileId}`));
    res.json({ success: true, message: '파일이 삭제되었습니다.' });
  } catch (error) {
    console.error(withTime(`❌ 파일 삭제 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '파일 삭제 실패' });
  }
});

/**
 * GET /api/admin/deleted
 * 삭제된 파일 목록 조회
 */
router.get('/deleted', verifyToken, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = getDeletedFiles(page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(withTime(`❌ 삭제된 파일 목록 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '삭제된 파일 목록 조회 실패' });
  }
});

/**
 * GET /api/admin/system-status
 * 시스템 상태 조회
 */
router.get('/system-status', verifyToken, (req, res) => {
  try {
    const status = getSystemStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error(withTime(`❌ 시스템 상태 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '시스템 상태 조회 실패' });
  }
});

module.exports = router;
