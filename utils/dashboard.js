const db = require('../config/db');

/**
 * 전체 변환 통계 조회
 */
const getConversionStats = () => {
  try {
    // 총 변환 횟수
    const totalConversions = db.prepare(
      `SELECT COUNT(*) as count FROM files WHERE file_type='converted' AND status='active'`
    ).get();

    // 오늘 변환 횟수
    const todayConversions = db.prepare(
      `SELECT COUNT(*) as count FROM files
       WHERE file_type='converted' AND status='active'
       AND DATE(created_at) = DATE('now')`
    ).get();

    // 어제 변환 횟수
    const yesterdayConversions = db.prepare(
      `SELECT COUNT(*) as count FROM files
       WHERE file_type='converted' AND status='active'
       AND DATE(created_at) = DATE('now', '-1 day')`
    ).get();

    // 지난 7일 변환 횟수
    const last7Days = db.prepare(
      `SELECT COUNT(*) as count FROM files
       WHERE file_type='converted' AND status='active'
       AND created_at >= datetime('now', '-7 days')`
    ).get();

    // 지난 30일 변환 횟수
    const last30Days = db.prepare(
      `SELECT COUNT(*) as count FROM files
       WHERE file_type='converted' AND status='active'
       AND created_at >= datetime('now', '-30 days')`
    ).get();

    return {
      total: totalConversions.count || 0,
      today: todayConversions.count || 0,
      yesterday: yesterdayConversions.count || 0,
      last7Days: last7Days.count || 0,
      last30Days: last30Days.count || 0
    };
  } catch (error) {
    console.error('❌ Error getting conversion stats:', error.message);
    return {
      total: 0,
      today: 0,
      yesterday: 0,
      last7Days: 0,
      last30Days: 0
    };
  }
};

/**
 * 포맷별 변환 통계
 */
const getFormatStats = () => {
  try {
    const stats = db.prepare(
      `SELECT
        CASE
          WHEN r2_path LIKE '%.docx' THEN 'Word (.docx)'
          WHEN r2_path LIKE '%.xlsx' THEN 'Excel (.xlsx)'
          WHEN r2_path LIKE '%.pptx' THEN 'PowerPoint (.pptx)'
          WHEN r2_path LIKE '%.zip' THEN 'Image (.zip)'
          WHEN r2_path LIKE '%.pdf' THEN 'PDF'
          WHEN r2_path LIKE '%.mp3' THEN 'MP3'
          WHEN r2_path LIKE '%.wav' THEN 'WAV'
          WHEN r2_path LIKE '%.ogg' THEN 'OGG'
          WHEN r2_path LIKE '%.m4a' THEN 'M4A'
          WHEN r2_path LIKE '%.aac' THEN 'AAC'
          WHEN r2_path LIKE '%.mp4' THEN 'MP4'
          WHEN r2_path LIKE '%.mov' THEN 'MOV'
          WHEN r2_path LIKE '%.webm' THEN 'WebM'
          WHEN r2_path LIKE '%.mkv' THEN 'MKV'
          ELSE 'Other'
        END as format,
        COUNT(*) as count
       FROM files
       WHERE file_type='converted' AND status='active'
       GROUP BY format
       ORDER BY count DESC`
    ).all();

    return stats || [];
  } catch (error) {
    console.error('❌ Error getting format stats:', error.message);
    return [];
  }
};

/**
 * 시간대별 변환량 (최근 24시간)
 */
const getHourlyStats = () => {
  try {
    const stats = db.prepare(
      `SELECT
        STRFTIME('%H', created_at) as hour,
        COUNT(*) as count
       FROM files
       WHERE file_type='converted' AND status='active'
       AND created_at >= datetime('now', '-24 hours')
       GROUP BY hour
       ORDER BY hour ASC`
    ).all();

    // 24시간 전체 데이터 생성 (누락된 시간은 0으로)
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[String(i).padStart(2, '0')] = 0;
    }

    stats.forEach(stat => {
      hourlyData[stat.hour] = stat.count;
    });

    return Object.entries(hourlyData).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));
  } catch (error) {
    console.error('❌ Error getting hourly stats:', error.message);
    return [];
  }
};

/**
 * 파일 목록 조회 (페이지네이션)
 */
const getFilesList = (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    const files = db.prepare(
      `SELECT id, file_id, r2_path, file_type, created_at, expires_at, status
       FROM files
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM files').get();

    const filesWithInfo = files.map(file => {
      // 확장자 추출
      const ext = file.r2_path.split('.').pop();

      // 파일명 추출
      const fileName = file.r2_path.split('/').pop();

      // 만료까지 남은 시간 계산
      const expiresAt = new Date(file.expires_at);
      const now = new Date();
      const timeLeft = expiresAt - now;
      const minutesLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60)));

      return {
        id: file.id,
        fileId: file.file_id,
        fileName: fileName,
        format: ext.toUpperCase(),
        r2Path: file.r2_path,
        fileType: file.file_type,
        createdAt: file.created_at,
        expiresAt: file.expires_at,
        minutesLeft: minutesLeft,
        status: file.status
      };
    });

    return {
      files: filesWithInfo,
      total: total.count || 0,
      page,
      limit,
      totalPages: Math.ceil((total.count || 0) / limit)
    };
  } catch (error) {
    console.error('❌ Error getting files list:', error.message);
    return {
      files: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

/**
 * 파일 정보 조회
 */
const getFileById = (fileId) => {
  try {
    const file = db.prepare(
      `SELECT id, file_id, r2_path, file_type, created_at, expires_at, deleted_at, status
       FROM files WHERE file_id = ?`
    ).get(fileId);

    if (!file) {
      return null;
    }

    const fileName = file.r2_path.split('/').pop();
    const ext = fileName.split('.').pop();

    return {
      id: file.id,
      fileId: file.file_id,
      fileName: fileName,
      format: ext.toUpperCase(),
      r2Path: file.r2_path,
      fileType: file.file_type,
      createdAt: file.created_at,
      expiresAt: file.expires_at,
      deletedAt: file.deleted_at,
      status: file.status
    };
  } catch (error) {
    console.error('❌ Error getting file by ID:', error.message);
    return null;
  }
};

/**
 * 시스템 상태 조회
 */
const getSystemStatus = () => {
  try {
    // DB 상태
    const dbStatus = {
      connected: true,
      fileCount: db.prepare('SELECT COUNT(*) as count FROM files').get().count || 0,
      activeFiles: db.prepare(
        `SELECT COUNT(*) as count FROM files WHERE status='active'`
      ).get().count || 0,
      deletedFiles: db.prepare(
        `SELECT COUNT(*) as count FROM files WHERE status='deleted'`
      ).get().count || 0,
      failedFiles: db.prepare(
        `SELECT COUNT(*) as count FROM files WHERE status='failed'`
      ).get().count || 0
    };

    // 저장소 상태 (DB 파일 크기로 추정)
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.resolve(__dirname, '../db/database.db');
    let dbSize = 0;
    try {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
    } catch (e) {
      // DB 파일 없음
    }

    return {
      timestamp: new Date().toISOString(),
      database: dbStatus,
      storage: {
        dbFileSizeMB: (dbSize / (1024 * 1024)).toFixed(2),
        dbFileSizeBytes: dbSize
      },
      uptime: process.uptime(),
      memoryUsage: {
        rss: (process.memoryUsage().rss / (1024 * 1024)).toFixed(2),
        heapUsed: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2),
        heapTotal: (process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(2)
      }
    };
  } catch (error) {
    console.error('❌ Error getting system status:', error.message);
    return {
      timestamp: new Date().toISOString(),
      database: { connected: false, error: error.message },
      storage: { dbFileSizeMB: 0, dbFileSizeBytes: 0 },
      uptime: 0,
      memoryUsage: {}
    };
  }
};

/**
 * 삭제된 파일 조회
 */
const getDeletedFiles = (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    const files = db.prepare(
      `SELECT id, file_id, r2_path, file_type, created_at, deleted_at, status
       FROM files
       WHERE status='deleted'
       ORDER BY deleted_at DESC
       LIMIT ? OFFSET ?`
    ).all(limit, offset);

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM files WHERE status=\'deleted\''
    ).get();

    const filesWithInfo = files.map(file => ({
      id: file.id,
      fileId: file.file_id,
      fileName: file.r2_path.split('/').pop(),
      format: file.r2_path.split('.').pop().toUpperCase(),
      createdAt: file.created_at,
      deletedAt: file.deleted_at,
      status: file.status
    }));

    return {
      files: filesWithInfo,
      total: total.count || 0,
      page,
      limit,
      totalPages: Math.ceil((total.count || 0) / limit)
    };
  } catch (error) {
    console.error('❌ Error getting deleted files:', error.message);
    return {
      files: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

module.exports = {
  getConversionStats,
  getFormatStats,
  getHourlyStats,
  getFilesList,
  getFileById,
  getSystemStatus,
  getDeletedFiles
};
