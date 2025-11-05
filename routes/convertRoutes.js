const express = require('express');
const { EXTENSION_MAP } = require('../utils/constants');
const { downloadFromR2, uploadToR2, deleteFromR2, generateR2Path } = require('../config/r2');
const { convert: convertWithPiscina } = require('../utils/converterPool');
const {
  ensurePdfToExcelSupport,
  getPdfToExcelSupportStatus
} = require('../utils/libreofficeCapabilities');
const db = require('../config/db');

const router = express.Router();

/**
 * POST /api/convert - 파일 변환 (LibreOffice + Piscina)
 *
 * 요청 본문:
 * {
 *   r2Path: "uploads/...",      // 원본 파일 R2 경로
 *   format: "word",             // 변환 형식 (word, excel, ppt, jpg, png)
 *   originalName: "file.pdf"    // 원본 파일명
 * }
 *
 * 응답:
 * {
 *   success: true,
 *   fileId: "1234567890",       // 변환된 파일 ID
 *   r2Path: "converted/...",    // 변환된 파일 R2 경로
 *   fileName: "file_converted.docx"
 * }
 *
 * 동작:
 * 1. R2에서 원본 PDF 파일 다운로드
 * 2. Piscina 스레드 풀에서 병렬 변환 (LibreOffice)
 * 3. 변환된 파일을 R2에 업로드
 * 4. DB에 파일 메타데이터 저장
 * 5. 원본 파일을 R2에서 즉시 삭제
 */
router.post('/', async (req, res) => {
  try {
    const { r2Path, format, originalName } = req.body;

    // 요청 검증
    if (!r2Path || !format) {
      return res.status(400).json({
        success: false,
        error: 'R2 경로와 형식이 필요합니다.'
      });
    }

    const validFormats = ['word', 'excel', 'ppt', 'jpg', 'png'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `지원하지 않는 형식입니다. 지원 형식: ${validFormats.join(', ')}`
      });
    }

    if (format === 'excel') {
      const excelSupported = await ensurePdfToExcelSupport();
      if (!excelSupported) {
        const { lastError } = getPdfToExcelSupportStatus();
        let detailMessage = 'LibreOffice에서 PDF → Excel 변환 필터를 찾지 못했습니다.';

        if (lastError) {
          const lowerMsg = (lastError.message || '').toLowerCase();
          if (lowerMsg.includes('no export filter')) {
            detailMessage = 'LibreOffice에서 PDF → Excel 내보내기 필터가 누락되어 있습니다.';
          } else if (lastError.code === 1 && !lastError.stderr) {
            detailMessage = 'LibreOffice 명령이 실패했고 추가 로그가 없습니다. XDG_RUNTIME_DIR 권한 또는 LibreOffice 설치 상태를 확인하세요.';
          } else if (lastError.message) {
            detailMessage = lastError.message;
          }
        }

        return res.status(503).json({
          success: false,
          error: '현재 서버에서 PDF → Excel 변환을 지원하지 않습니다.',
          details: detailMessage
        });
      }
    }

    console.log(`\n========== 파일 변환 시작 ==========`);
    console.log(`📝 형식: ${format}`);
    console.log(`📄 원본: ${originalName}`);
    console.log(`📍 경로: ${r2Path}`);

    // 1️⃣ R2에서 원본 PDF 파일 다운로드
    console.log(`\n[1/5] 📥 R2에서 PDF 파일 다운로드`);
    const pdfBuffer = await downloadFromR2(r2Path);
    console.log(`✅ 다운로드 완료 (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    // 2️⃣ Piscina 스레드 풀에서 변환
    console.log(`\n[2/5] 🔄 Piscina에서 변환 작업 실행`);
    const result = await convertWithPiscina(pdfBuffer, format);

    if (!result.success) {
      const workerError = new Error(result.error || '워커 변환 작업이 실패했습니다.');
      if (result.code) {
        workerError.code = result.code;
      }
      throw workerError;
    }

    const convertedBuffer = result.buffer;
    console.log(`✅ 변환 완료 (${(convertedBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    // 3️⃣ 변환된 파일명 생성
    console.log(`\n[3/5] 📝 파일명 생성`);
    const ext = EXTENSION_MAP[format] || '.docx';
    const parsedName = originalName.substring(0, originalName.lastIndexOf('.'));
    const convertedFileName = `${parsedName}_converted${ext}`;
    const convertedR2Path = generateR2Path(convertedFileName, 'converted');
    console.log(`✅ 파일명: ${convertedFileName}`);

    // 4️⃣ 변환된 파일을 R2에 업로드
    console.log(`\n[4/5] 📤 R2에 변환된 파일 업로드`);
    await uploadToR2(convertedR2Path, convertedBuffer, 'application/octet-stream');
    console.log(`✅ 업로드 완료: ${convertedR2Path}`);

    // 5️⃣ DB에 파일 메타데이터 저장
    console.log(`\n[5/5] 💾 DB에 파일 정보 저장`);
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare(`
      INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(fileId, convertedR2Path, 'converted', tenMinutesLater, 'active');
    console.log(`✅ DB 저장 완료: ${fileId}`);

    // 6️⃣ 원본 파일을 R2에서 즉시 삭제
    console.log(`\n🗑️ R2에서 원본 파일 삭제`);
    await deleteFromR2(r2Path);
    console.log(`✅ 삭제 완료`);

    console.log(`\n========== 변환 완료 ==========\n`);

    res.json({
      success: true,
      fileId: fileId,
      r2Path: convertedR2Path,
      fileName: convertedFileName,
      message: `변환 완료: ${convertedFileName}`
    });
  } catch (error) {
    console.error('\n❌ 파일 변환 실패:', error.message);
    console.error(error.stack);

    if (error.code === 'LIBREOFFICE_NO_XLSX_FILTER') {
      return res.status(503).json({
        success: false,
        error: 'LibreOffice에서 PDF → Excel 변환 필터를 찾지 못했습니다.',
        details: 'libreoffice-calc 및 pdfimport 패키지가 설치되어 있는지 확인하거나 외부 PDF → Excel 엔진을 연동해야 합니다.'
      });
    }

    res.status(500).json({
      success: false,
      error: '파일 변환에 실패했습니다.',
      details: error.message
    });
  }
});

module.exports = router;
