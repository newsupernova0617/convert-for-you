const { count, eq, gte, and, sql, desc } = require('drizzle-orm');
const { files } = require('../drizzle/schema');
const db = require('../config/db');

/**
 * 전체 변환 통계 조회
 */
const getConversionStats = async () => {
  try {
    // 총 변환 횟수
    const totalConversions = await db
      .select({ count: count() })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active')
      ));

    // 오늘 변환 횟수
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayConversions = await db
      .select({ count: count() })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active'),
        gte(files.createdAt, todayStart)
      ));

    // 어제 변환 횟수
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStart = yesterdayDate.toISOString();
    const yesterdayEnd = new Date(yesterdayDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const yesterdayConversions = await db
      .select({ count: count() })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active'),
        gte(files.createdAt, yesterdayStart),
        sql`${files.createdAt} < ${yesterdayEnd}`
      ));

    // 지난 7일 변환 횟수
    const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last7Days = await db
      .select({ count: count() })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active'),
        gte(files.createdAt, last7DaysStart)
      ));

    // 지난 30일 변환 횟수
    const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const last30Days = await db
      .select({ count: count() })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active'),
        gte(files.createdAt, last30DaysStart)
      ));

    return {
      total: totalConversions[0]?.count || 0,
      today: todayConversions[0]?.count || 0,
      yesterday: yesterdayConversions[0]?.count || 0,
      last7Days: last7Days[0]?.count || 0,
      last30Days: last30Days[0]?.count || 0
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
const getFormatStats = async () => {
  try {
    const stats = await db
      .select({
        format: sql`
          CASE
            WHEN ${files.r2Path} LIKE '%.docx' THEN 'Word (.docx)'
            WHEN ${files.r2Path} LIKE '%.xlsx' THEN 'Excel (.xlsx)'
            WHEN ${files.r2Path} LIKE '%.pptx' THEN 'PowerPoint (.pptx)'
            WHEN ${files.r2Path} LIKE '%.zip' THEN 'Image (.zip)'
            WHEN ${files.r2Path} LIKE '%.pdf' THEN 'PDF'
            WHEN ${files.r2Path} LIKE '%.mp3' THEN 'MP3'
            WHEN ${files.r2Path} LIKE '%.wav' THEN 'WAV'
            WHEN ${files.r2Path} LIKE '%.ogg' THEN 'OGG'
            WHEN ${files.r2Path} LIKE '%.m4a' THEN 'M4A'
            WHEN ${files.r2Path} LIKE '%.aac' THEN 'AAC'
            WHEN ${files.r2Path} LIKE '%.mp4' THEN 'MP4'
            WHEN ${files.r2Path} LIKE '%.mov' THEN 'MOV'
            WHEN ${files.r2Path} LIKE '%.webm' THEN 'WebM'
            WHEN ${files.r2Path} LIKE '%.mkv' THEN 'MKV'
            ELSE 'Other'
          END
        `,
        count: count()
      })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active')
      ))
      .groupBy(sql`format`)
      .orderBy(sql`count DESC`);

    return stats || [];
  } catch (error) {
    console.error('❌ Error getting format stats:', error.message);
    return [];
  }
};

/**
 * 시간대별 변환량 (최근 24시간)
 */
const getHourlyStats = async () => {
  try {
    const last24HoursStart = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString();

    const stats = await db
      .select({
        hour: sql`STRFTIME('%H', ${files.createdAt})`,
        count: count()
      })
      .from(files)
      .where(and(
        eq(files.fileType, 'converted'),
        eq(files.status, 'active'),
        gte(files.createdAt, last24HoursStart)
      ))
      .groupBy(sql`STRFTIME('%H', ${files.createdAt})`)
      .orderBy(sql`hour ASC`);

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
const getFilesList = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    const fileList = await db
      .select()
      .from(files)
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(files);

    const filesWithInfo = fileList.map(file => {
      // 확장자 추출
      const ext = file.r2Path.split('.').pop();

      // 파일명 추출
      const fileName = file.r2Path.split('/').pop();

      // 만료까지 남은 시간 계산
      const expiresAt = new Date(file.expiresAt);
      const now = new Date();
      const timeLeft = expiresAt - now;
      const minutesLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60)));

      return {
        id: file.id,
        fileId: file.fileId,
        fileName: fileName,
        format: ext.toUpperCase(),
        r2Path: file.r2Path,
        fileType: file.fileType,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt,
        minutesLeft: minutesLeft,
        status: file.status
      };
    });

    const total = totalResult[0]?.count || 0;

    return {
      files: filesWithInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
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
const getFileById = async (fileId) => {
  try {
    const fileList = await db
      .select()
      .from(files)
      .where(eq(files.fileId, fileId));

    if (!fileList || fileList.length === 0) {
      return null;
    }

    const file = fileList[0];
    const fileName = file.r2Path.split('/').pop();
    const ext = fileName.split('.').pop();

    return {
      id: file.id,
      fileId: file.fileId,
      fileName: fileName,
      format: ext.toUpperCase(),
      r2Path: file.r2Path,
      fileType: file.fileType,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      deletedAt: file.deletedAt,
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
const getSystemStatus = async () => {
  try {
    // DB 상태 - count queries
    const totalFilesResult = await db
      .select({ count: count() })
      .from(files);

    const activeFilesResult = await db
      .select({ count: count() })
      .from(files)
      .where(eq(files.status, 'active'));

    const deletedFilesResult = await db
      .select({ count: count() })
      .from(files)
      .where(eq(files.status, 'deleted'));

    const failedFilesResult = await db
      .select({ count: count() })
      .from(files)
      .where(eq(files.status, 'failed'));

    const dbStatus = {
      connected: true,
      fileCount: totalFilesResult[0]?.count || 0,
      activeFiles: activeFilesResult[0]?.count || 0,
      deletedFiles: deletedFilesResult[0]?.count || 0,
      failedFiles: failedFilesResult[0]?.count || 0
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
const getDeletedFiles = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    const fileList = await db
      .select()
      .from(files)
      .where(eq(files.status, 'deleted'))
      .orderBy(desc(files.deletedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(files)
      .where(eq(files.status, 'deleted'));

    const filesWithInfo = fileList.map(file => ({
      id: file.id,
      fileId: file.fileId,
      fileName: file.r2Path.split('/').pop(),
      format: file.r2Path.split('.').pop().toUpperCase(),
      createdAt: file.createdAt,
      deletedAt: file.deletedAt,
      status: file.status
    }));

    const total = totalResult[0]?.count || 0;

    return {
      files: filesWithInfo,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
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
