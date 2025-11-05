const express = require('express');
const { EXTENSION_MAP } = require('../utils/constants');
const { downloadFromR2, uploadToR2, deleteFromR2, generateR2Path } = require('../config/r2');
const { convert: convertWithPiscina } = require('../utils/converterPool');
const db = require('../config/db');
const { withTime } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/convert - 파일 변환 (워커 풀 활용)
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
 * 2. Piscina 스레드 풀에서 병렬 변환
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

    const validFormats = ['word', 'excel', 'ppt', 'jpg', 'png', 'word2pdf', 'excel2pdf', 'ppt2pdf', 'merge', 'split', 'compress'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `지원하지 않는 형식입니다. 지원 형식: ${validFormats.join(', ')}`
      });
    }

    // Office → PDF 변환 여부 확인
    const isOfficeToPdf = format.endsWith('2pdf');

    console.log(withTime(`\n========== 파일 변환 시작 ==========`));
    console.log(withTime(`📝 형식: ${format}`));
    console.log(withTime(`📄 원본: ${originalName}`));
    console.log(withTime(`📍 경로: ${r2Path}`));

    // 1️⃣ R2에서 원본 파일 다운로드
    const fileTypeLabel = isOfficeToPdf ? 'Office 파일' : 'PDF 파일';
    console.log(withTime(`\n[1/5] 📥 R2에서 ${fileTypeLabel} 다운로드`));
    const fileBuffer = await downloadFromR2(r2Path);
    console.log(withTime(`✅ 다운로드 완료 (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`));

    // 2️⃣ Piscina 스레드 풀에서 변환
    console.log(withTime(`\n[2/5] 🔄 Piscina에서 변환 작업 실행`));
    const result = await convertWithPiscina(fileBuffer, format);

    if (!result.success) {
      const workerError = new Error(result.error || '워커 변환 작업이 실패했습니다.');
      if (result.code) {
        workerError.code = result.code;
      }
      throw workerError;
    }

    const convertedBuffer = result.buffer;
    console.log(withTime(`✅ 변환 완료 (${(convertedBuffer.length / 1024 / 1024).toFixed(2)}MB)`));

    // 3️⃣ 변환된 파일명 생성
    console.log(withTime(`\n[3/5] 📝 파일명 생성`));
    const ext = EXTENSION_MAP[format] || '.docx';
    const parsedName = originalName.substring(0, originalName.lastIndexOf('.'));
    const convertedFileName = `${parsedName}_converted${ext}`;
    const convertedR2Path = generateR2Path(convertedFileName, 'converted');
    console.log(withTime(`✅ 파일명: ${convertedFileName}`));

    // 4️⃣ 변환된 파일을 R2에 업로드
    console.log(withTime(`\n[4/5] 📤 R2에 변환된 파일 업로드`));
    await uploadToR2(convertedR2Path, convertedBuffer, 'application/octet-stream');
    console.log(withTime(`✅ 업로드 완료: ${convertedR2Path}`));

    // 5️⃣ DB에 파일 메타데이터 저장
    console.log(withTime(`\n[5/5] 💾 DB에 파일 정보 저장`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare(`
      INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(fileId, convertedR2Path, 'converted', tenMinutesLater, 'active');
    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));

    // 6️⃣ 원본 파일을 R2에서 즉시 삭제
    console.log(withTime(`\n🗑️ R2에서 원본 파일 삭제`));
    await deleteFromR2(r2Path);
    console.log(withTime(`✅ 삭제 완료`));

    console.log(withTime(`\n========== 변환 완료 ==========\n`));

    res.json({
      success: true,
      fileId: fileId,
      r2Path: convertedR2Path,
      fileName: convertedFileName,
      message: `변환 완료: ${convertedFileName}`
    });
  } catch (error) {
    console.error(withTime('\n❌ 파일 변환 실패:'), error.message);
    console.error(withTime('스택 추적:'), error.stack);

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

/**
 * POST /api/merge - PDF 병합
 *
 * 요청 본문:
 * {
 *   r2Paths: ["uploads/...", "uploads/..."],  // 원본 PDF R2 경로 배열
 *   fileNames: ["file1.pdf", "file2.pdf"]     // 원본 파일명 배열
 * }
 *
 * 응답:
 * {
 *   success: true,
 *   fileId: "1234567890",
 *   r2Path: "converted/...",
 *   fileName: "merged.pdf"
 * }
 *
 * 동작:
 * 1. R2에서 모든 PDF 파일 다운로드
 * 2. Piscina 스레드 풀에서 PDF 병합
 * 3. 병합된 파일을 R2에 업로드
 * 4. DB에 파일 메타데이터 저장
 * 5. 원본 파일들을 R2에서 삭제
 */
router.post('/merge', async (req, res) => {
  try {
    const { r2Paths, fileNames } = req.body;

    // 요청 검증
    if (!r2Paths || !Array.isArray(r2Paths) || r2Paths.length < 2) {
      return res.status(400).json({
        success: false,
        error: '최소 2개 이상의 PDF 파일 경로가 필요합니다.'
      });
    }

    if (r2Paths.length > 20) {
      return res.status(400).json({
        success: false,
        error: '최대 20개까지만 병합 가능합니다.'
      });
    }

    console.log(withTime(`\n========== PDF 병합 시작 ==========`));
    console.log(withTime(`📄 파일 수: ${r2Paths.length}개`));

    // 1️⃣ R2에서 모든 PDF 파일 다운로드
    console.log(withTime(`\n[1/5] 📥 R2에서 PDF 파일 다운로드`));
    const pdfBuffers = [];
    let totalSize = 0;

    for (let i = 0; i < r2Paths.length; i++) {
      const r2Path = r2Paths[i];
      const fileName = fileNames?.[i] || `파일${i + 1}.pdf`;

      try {
        const fileBuffer = await downloadFromR2(r2Path);
        pdfBuffers.push(fileBuffer);
        totalSize += fileBuffer.length;
        console.log(withTime(`  ✓ ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`));
      } catch (error) {
        console.error(withTime(`  ✗ ${fileName} 다운로드 실패`));
        throw new Error(`"${fileName}" 다운로드 실패: ${error.message}`);
      }
    }

    console.log(withTime(`✅ 다운로드 완료 (총 ${(totalSize / 1024 / 1024).toFixed(2)}MB)`));

    // 2️⃣ Piscina 스레드 풀에서 병합
    console.log(withTime(`\n[2/5] 🔄 Piscina에서 PDF 병합 실행`));
    const result = await convertWithPiscina(pdfBuffers, 'merge', fileNames);

    if (!result.success) {
      const workerError = new Error(result.error || '워커 병합 작업이 실패했습니다.');
      if (result.code) {
        workerError.code = result.code;
      }
      throw workerError;
    }

    const mergedBuffer = result.buffer;
    console.log(withTime(`✅ 병합 완료 (${(mergedBuffer.length / 1024 / 1024).toFixed(2)}MB)`));

    // 3️⃣ 병합된 파일명 생성
    console.log(withTime(`\n[3/5] 📝 파일명 생성`));
    const mergedFileName = `merged.pdf`;
    const mergedR2Path = generateR2Path(mergedFileName, 'converted');
    console.log(withTime(`✅ 파일명: ${mergedFileName}`));

    // 4️⃣ 병합된 파일을 R2에 업로드
    console.log(withTime(`\n[4/5] 📤 R2에 병합된 파일 업로드`));
    await uploadToR2(mergedR2Path, mergedBuffer, 'application/pdf');
    console.log(withTime(`✅ 업로드 완료: ${mergedR2Path}`));

    // 5️⃣ DB에 파일 메타데이터 저장
    console.log(withTime(`\n[5/5] 💾 DB에 파일 정보 저장`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare(`
      INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(fileId, mergedR2Path, 'converted', tenMinutesLater, 'active');
    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));

    // 6️⃣ 원본 파일들을 R2에서 삭제
    console.log(withTime(`\n🗑️ R2에서 원본 파일 삭제`));
    for (let i = 0; i < r2Paths.length; i++) {
      const r2Path = r2Paths[i];
      const fileName = fileNames?.[i] || `파일${i + 1}.pdf`;

      try {
        await deleteFromR2(r2Path);
        console.log(withTime(`  ✓ ${fileName} 삭제 완료`));
      } catch (error) {
        console.error(withTime(`  ✗ ${fileName} 삭제 실패`));
        // 삭제 실패는 무시하고 계속 진행
      }
    }
    console.log(withTime(`✅ 삭제 완료`));

    console.log(withTime(`\n========== PDF 병합 완료 ==========\n`));

    res.json({
      success: true,
      fileId: fileId,
      r2Path: mergedR2Path,
      fileName: mergedFileName,
      message: `병합 완료: ${mergedFileName}`
    });
  } catch (error) {
    console.error(withTime('\n❌ PDF 병합 실패:'), error.message);
    console.error(withTime('스택 추적:'), error.stack);

    res.status(500).json({
      success: false,
      error: 'PDF 병합에 실패했습니다.',
      details: error.message
    });
  }
});

/**
 * POST /api/split - PDF 분할
 *
 * 요청 본문:
 * {
 *   r2Path: "uploads/...",        // 원본 PDF R2 경로
 *   ranges: [{start: 1, end: 5}, {start: 6, end: 10}]  // 분할 범위 배열
 * }
 *
 * 응답:
 * {
 *   success: true,
 *   fileId: "1234567890",
 *   r2Path: "converted/...",
 *   fileName: "split.zip"
 * }
 *
 * 동작:
 * 1. R2에서 PDF 파일 다운로드
 * 2. Piscina 스레드 풀에서 PDF 분할
 * 3. 분할된 PDF들을 ZIP으로 패킹
 * 4. ZIP 파일을 R2에 업로드
 * 5. DB에 파일 메타데이터 저장
 * 6. 원본 파일을 R2에서 삭제
 */
router.post('/split', async (req, res) => {
  try {
    const { r2Path, ranges } = req.body;

    // 요청 검증
    if (!r2Path) {
      return res.status(400).json({
        success: false,
        error: 'PDF R2 경로가 필요합니다.'
      });
    }

    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      return res.status(400).json({
        success: false,
        error: '최소 1개 이상의 분할 범위가 필요합니다.'
      });
    }

    if (ranges.length > 50) {
      return res.status(400).json({
        success: false,
        error: '최대 50개까지만 분할 가능합니다.'
      });
    }

    console.log(withTime(`\n========== PDF 분할 시작 ==========`));
    console.log(withTime(`📄 분할 범위: ${ranges.length}개`));

    // 1️⃣ R2에서 PDF 파일 다운로드
    console.log(withTime(`\n[1/5] 📥 R2에서 PDF 파일 다운로드`));
    let fileBuffer;
    try {
      fileBuffer = await downloadFromR2(r2Path);
      console.log(withTime(`✅ 다운로드 완료 (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`));
    } catch (error) {
      console.error(withTime(`  ✗ PDF 다운로드 실패`));
      throw new Error(`PDF 다운로드 실패: ${error.message}`);
    }

    // 2️⃣ Piscina 스레드 풀에서 분할
    console.log(withTime(`\n[2/5] 🔄 Piscina에서 PDF 분할 실행`));
    const result = await convertWithPiscina(fileBuffer, 'split', ranges);

    if (!result.success) {
      const workerError = new Error(result.error || '워커 분할 작업이 실패했습니다.');
      if (result.code) {
        workerError.code = result.code;
      }
      throw workerError;
    }

    const splitZipBuffer = result.buffer;
    console.log(withTime(`✅ 분할 완료 (${(splitZipBuffer.length / 1024 / 1024).toFixed(2)}MB)ZIP`));

    // 3️⃣ 분할된 파일명 생성
    console.log(withTime(`\n[3/5] 📝 파일명 생성`));
    const splitFileName = `split.zip`;
    const splitR2Path = generateR2Path(splitFileName, 'converted');
    console.log(withTime(`✅ 파일명: ${splitFileName}`));

    // 4️⃣ 분할 ZIP 파일을 R2에 업로드
    console.log(withTime(`\n[4/5] 📤 R2에 분할 ZIP 파일 업로드`));
    await uploadToR2(splitR2Path, splitZipBuffer, 'application/zip');
    console.log(withTime(`✅ 업로드 완료: ${splitR2Path}`));

    // 5️⃣ DB에 파일 메타데이터 저장
    console.log(withTime(`\n[5/5] 💾 DB에 파일 정보 저장`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare(`
      INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(fileId, splitR2Path, 'converted', tenMinutesLater, 'active');
    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));

    // 6️⃣ 원본 파일을 R2에서 삭제
    console.log(withTime(`\n🗑️ R2에서 원본 파일 삭제`));
    try {
      await deleteFromR2(r2Path);
      console.log(withTime(`✅ 삭제 완료`));
    } catch (error) {
      console.error(withTime(`  ✗ 원본 파일 삭제 실패`));
    }

    console.log(withTime(`\n========== PDF 분할 완료 ==========\n`));

    res.json({
      success: true,
      fileId: fileId,
      r2Path: splitR2Path,
      fileName: splitFileName,
      message: `분할 완료: ${splitFileName}`
    });
  } catch (error) {
    console.error(withTime('\n❌ PDF 분할 실패:'), error.message);
    console.error(withTime('스택 추적:'), error.stack);

    res.status(500).json({
      success: false,
      error: 'PDF 분할에 실패했습니다.',
      details: error.message
    });
  }
});

/**
 * POST /api/compress - PDF 압축
 */
router.post('/compress', async (req, res) => {
  try {
    const { r2Path, quality } = req.body;

    if (!r2Path) {
      return res.status(400).json({
        success: false,
        error: 'PDF R2 경로가 필요합니다.'
      });
    }

    console.log(withTime(`\n========== PDF 압축 시작 ==========`));
    console.log(withTime(`📊 품질: ${quality || 'medium'}`));

    // R2에서 PDF 다운로드
    console.log(withTime(`\n[1/4] 📥 R2에서 PDF 파일 다운로드`));
    const fileBuffer = await downloadFromR2(r2Path);
    console.log(withTime(`✅ 다운로드 완료 (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`));

    // 압축 실행
    console.log(withTime(`\n[2/4] 🔄 Piscina에서 PDF 압축 실행`));
    const result = await convertWithPiscina(fileBuffer, 'compress', quality || 'medium');

    if (!result.success) {
      throw new Error(result.error || '압축 실패');
    }

    const compressedBuffer = result.buffer;
    const originalSize = fileBuffer.length;
    const ratio = ((1 - compressedBuffer.length / originalSize) * 100).toFixed(1);
    console.log(withTime(`✅ 압축 완료 (${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB) - ${ratio}% 감소`));

    // 파일명 생성
    console.log(withTime(`\n[3/4] 📝 파일명 생성`));
    const compressedFileName = `compressed.pdf`;
    const compressedR2Path = generateR2Path(compressedFileName, 'converted');
    console.log(withTime(`✅ 파일명: ${compressedFileName}`));

    // R2에 업로드
    console.log(withTime(`\n[4/4] 📤 R2에 압축 파일 업로드`));
    await uploadToR2(compressedR2Path, compressedBuffer, 'application/pdf');
    console.log(withTime(`✅ 업로드 완료: ${compressedR2Path}`));

    // DB 저장
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    const stmt = db.prepare(`
      INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(fileId, compressedR2Path, 'converted', tenMinutesLater, 'active');

    // 원본 삭제
    try {
      await deleteFromR2(r2Path);
    } catch (err) {
      console.warn(withTime('원본 파일 삭제 실패'));
    }

    console.log(withTime(`\n========== PDF 압축 완료 ==========\n`));

    res.json({
      success: true,
      fileId: fileId,
      r2Path: compressedR2Path,
      fileName: compressedFileName,
      message: `압축 완료: ${compressedFileName}`
    });
  } catch (error) {
    console.error(withTime('\n❌ PDF 압축 실패:'), error.message);
    res.status(500).json({
      success: false,
      error: 'PDF 압축에 실패했습니다.',
      details: error.message
    });
  }
});

module.exports = router;
