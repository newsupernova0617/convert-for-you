const express = require('express');
const { EXTENSION_MAP, MAX_MERGE_SIZE, FILE_EXPIRY_MINUTES } = require('../utils/constants');
const { downloadFromR2, uploadToR2, deleteFromR2, generateR2Path } = require('../config/r2');
const { convert: convertWithPiscina } = require('../utils/converterPool');
const db = require('../config/db');
const { withTime } = require('../utils/logger');
const { sanitizeFilename } = require('../utils/sanitizer');
const { safeConversionWithTransaction, safeCleanupWithTransaction } = require('../utils/dbTransaction');

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

    const validFormats = [
      'word', 'excel', 'ppt', 'jpg', 'png',
      'word2pdf', 'excel2pdf', 'ppt2pdf',
      'merge', 'split', 'compress',
      'jpg-to-png', 'png-to-jpg', 'jpg-to-webp', 'png-to-webp', 'webp-to-jpg', 'webp-to-png',
      'heic-to-jpg', 'heic-to-png', 'heic-to-webp',
      'resize', 'compress-image',
      'mp3', 'wav', 'ogg', 'm4a', 'aac',
      'mp4', 'mov', 'webm', 'mkv',
      'compress-video', 'gif'
    ];
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
    // 파일명 sanitize (XSS, 경로 조회 공격 방지)
    const safeParsedName = sanitizeFilename(parsedName);
    const convertedFileName = `${safeParsedName}_converted${ext}`;
    const convertedR2Path = generateR2Path(convertedFileName, 'converted');
    console.log(withTime(`✅ 파일명: ${convertedFileName}`));

    // 4️⃣ 변환된 파일을 R2에 업로드 + DB 저장 (트랜잭션)
    console.log(withTime(`\n[4/5] 📤 R2에 변환된 파일 업로드`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    // R2 업로드 작업을 함수로 래핑
    const uploadAndCleanupOperation = async () => {
      try {
        // R2에 변환된 파일 업로드
        await uploadToR2(convertedR2Path, convertedBuffer, 'application/octet-stream');
        console.log(withTime(`✅ R2 업로드 완료: ${convertedR2Path}`));

        // 업로드 성공 후 원본 파일 삭제 (최선의 노력)
        try {
          await deleteFromR2(r2Path);
          console.log(withTime(`✅ 원본 파일 R2 삭제 완료: ${r2Path}`));
        } catch (deleteError) {
          // 원본 삭제 실패는 로그하지만 진행 계속
          // (변환 파일은 업로드되었으므로)
          console.warn(withTime(`⚠️  원본 파일 삭제 실패 (무시하고 계속): ${r2Path}`), deleteError.message);
        }

        return { success: true, r2Path: convertedR2Path };
      } catch (uploadError) {
        throw new Error(`R2 작업 실패: ${uploadError.message}`);
      }
    };

    // R2 작업 + DB 저장을 트랜잭션으로 처리
    console.log(withTime(`\n[5/5] 💾 R2 업로드 + DB 저장 (트랜잭션)`));
    const conversionResult = await safeConversionWithTransaction(db, uploadAndCleanupOperation, {
      fileId: fileId,
      r2Path: convertedR2Path,
      fileType: 'converted',
      expiresAt: tenMinutesLater
    });

    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));
    console.log(withTime(`\n========== 변환 완료 ==========\n`));

    res.json({
      success: true,
      fileId: fileId,
      r2Path: convertedR2Path,
      fileName: convertedFileName,
      message: `변환 완료: ${convertedFileName}`
    });
  } catch (error) {
    // 서버 로그에만 상세 정보 기록
    console.error(withTime('\n❌ 파일 변환 실패:'), error.message);
    console.error(withTime('스택 추적:'), error.stack);

    // 클라이언트에는 제네릭 에러 메시지만 반환 (정보 유출 방지)
    if (error.code === 'LIBREOFFICE_NO_XLSX_FILTER') {
      return res.status(503).json({
        success: false,
        error: '파일 변환에 일시적으로 실패했습니다. 잠시 후 다시 시도하세요.'
      });
    }

    res.status(500).json({
      success: false,
      error: '파일 변환에 실패했습니다. 잠시 후 다시 시도하세요.'
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
        totalSize += fileBuffer.length;

        // 누적 크기 검증 (메모리 초과 방지)
        if (totalSize > MAX_MERGE_SIZE) {
          return res.status(413).json({
            success: false,
            error: `병합 파일의 총 크기가 ${MAX_MERGE_SIZE / 1024 / 1024}MB를 초과했습니다.`
          });
        }

        pdfBuffers.push(fileBuffer);
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

    // 4️⃣ 병합된 파일을 R2에 업로드 + DB 저장 (트랜잭션)
    console.log(withTime(`\n[4/5] 📤 R2에 병합된 파일 업로드`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    // R2 업로드 작업을 함수로 래핑
    const mergeUploadAndCleanupOperation = async () => {
      try {
        // R2에 병합된 파일 업로드
        await uploadToR2(mergedR2Path, mergedBuffer, 'application/pdf');
        console.log(withTime(`✅ R2 업로드 완료: ${mergedR2Path}`));

        // 업로드 성공 후 원본 파일들 삭제 (최선의 노력)
        console.log(withTime(`\n🗑️ R2에서 원본 파일 삭제`));
        for (let i = 0; i < r2Paths.length; i++) {
          const r2Path = r2Paths[i];
          const fileName = fileNames?.[i] || `파일${i + 1}.pdf`;

          try {
            await deleteFromR2(r2Path);
            console.log(withTime(`  ✓ ${fileName} 삭제 완료`));
          } catch (deleteError) {
            console.warn(withTime(`  ⚠️ ${fileName} 삭제 실패 (무시하고 계속)`), deleteError.message);
          }
        }
        console.log(withTime(`✅ 원본 파일 삭제 완료 (일부 실패 가능)`));

        return { success: true, r2Path: mergedR2Path };
      } catch (uploadError) {
        throw new Error(`R2 병합 작업 실패: ${uploadError.message}`);
      }
    };

    // R2 작업 + DB 저장을 트랜잭션으로 처리
    console.log(withTime(`\n[5/5] 💾 R2 업로드 + DB 저장 (트랜잭션)`));
    const mergeResult = await safeConversionWithTransaction(db, mergeUploadAndCleanupOperation, {
      fileId: fileId,
      r2Path: mergedR2Path,
      fileType: 'converted',
      expiresAt: tenMinutesLater
    });

    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));
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

    // 클라이언트에는 제네릭 에러 메시지만 반환
    res.status(500).json({
      success: false,
      error: 'PDF 병합에 실패했습니다. 잠시 후 다시 시도하세요.'
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

    // 4️⃣ 분할 ZIP 파일을 R2에 업로드 + DB 저장 (트랜잭션)
    console.log(withTime(`\n[4/5] 📤 R2에 분할 ZIP 파일 업로드`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // SQLite datetime 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    // R2 업로드 작업을 함수로 래핑
    const splitUploadAndCleanupOperation = async () => {
      try {
        // R2에 분할 ZIP 파일 업로드
        await uploadToR2(splitR2Path, splitZipBuffer, 'application/zip');
        console.log(withTime(`✅ R2 업로드 완료: ${splitR2Path}`));

        // 업로드 성공 후 원본 파일 삭제
        try {
          await deleteFromR2(r2Path);
          console.log(withTime(`✅ 원본 파일 R2 삭제 완료: ${r2Path}`));
        } catch (deleteError) {
          console.warn(withTime(`⚠️  원본 파일 삭제 실패 (무시하고 계속): ${r2Path}`), deleteError.message);
        }

        return { success: true, r2Path: splitR2Path };
      } catch (uploadError) {
        throw new Error(`R2 분할 작업 실패: ${uploadError.message}`);
      }
    };

    // R2 작업 + DB 저장을 트랜잭션으로 처리
    console.log(withTime(`\n[5/5] 💾 R2 업로드 + DB 저장 (트랜잭션)`));
    const splitResult = await safeConversionWithTransaction(db, splitUploadAndCleanupOperation, {
      fileId: fileId,
      r2Path: splitR2Path,
      fileType: 'converted',
      expiresAt: tenMinutesLater
    });

    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));
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

    // R2에 업로드 + DB 저장 (트랜잭션)
    console.log(withTime(`\n[4/4] 📤 R2에 압축 파일 업로드 + DB 저장`));
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    // R2 업로드 작업을 함수로 래핑
    const compressUploadAndCleanupOperation = async () => {
      try {
        // R2에 압축 파일 업로드
        await uploadToR2(compressedR2Path, compressedBuffer, 'application/pdf');
        console.log(withTime(`✅ R2 업로드 완료: ${compressedR2Path}`));

        // 업로드 성공 후 원본 파일 삭제
        try {
          await deleteFromR2(r2Path);
          console.log(withTime(`✅ 원본 파일 R2 삭제 완료: ${r2Path}`));
        } catch (deleteError) {
          console.warn(withTime(`⚠️  원본 파일 삭제 실패 (무시하고 계속): ${r2Path}`), deleteError.message);
        }

        return { success: true, r2Path: compressedR2Path };
      } catch (uploadError) {
        throw new Error(`R2 압축 작업 실패: ${uploadError.message}`);
      }
    };

    // R2 작업 + DB 저장을 트랜잭션으로 처리
    const compressResult = await safeConversionWithTransaction(db, compressUploadAndCleanupOperation, {
      fileId: fileId,
      r2Path: compressedR2Path,
      fileType: 'converted',
      expiresAt: tenMinutesLater
    });

    console.log(withTime(`✅ DB 저장 완료: ${fileId}`));
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

/**
 * POST /api/image - 이미지 변환/리사이즈
 */
router.post('/image', async (req, res) => {
  try {
    const { r2Path, format, quality, backgroundColor, options } = req.body;

    if (!r2Path || !format) {
      return res.status(400).json({
        success: false,
        error: 'R2 경로와 형식이 필요합니다.'
      });
    }

    const validFormats = ['jpg-to-png', 'png-to-jpg', 'jpg-to-webp', 'png-to-webp', 'webp-to-jpg', 'webp-to-png', 'heic-to-jpg', 'heic-to-png', 'heic-to-webp', 'resize', 'compress-image'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `지원하지 않는 형식입니다: ${format}`
      });
    }

    console.log(withTime(`\n========== 이미지 변환 시작 ==========`));
    console.log(withTime(`📸 형식: ${format}`));

    // R2에서 이미지 다운로드
    const imageBuffer = await downloadFromR2(r2Path);
    console.log(withTime(`✅ 다운로드 완료 (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB)`));

    // 변환 실행
    console.log(withTime(`🔄 Piscina에서 이미지 변환 실행`));
    let convertResult;
    if (format === 'png-to-jpg') {
      convertResult = await convertWithPiscina(imageBuffer, format, backgroundColor || '#ffffff');
    } else if (['jpg-to-webp', 'png-to-webp', 'heic-to-jpg', 'heic-to-webp'].includes(format)) {
      convertResult = await convertWithPiscina(imageBuffer, format, quality || 80);
    } else if (['resize', 'compress-image'].includes(format)) {
      convertResult = await convertWithPiscina(imageBuffer, format, options);
    } else {
      convertResult = await convertWithPiscina(imageBuffer, format);
    }

    if (!convertResult.success) {
      throw new Error(convertResult.error || '변환 실패');
    }

    const convertedBuffer = convertResult.buffer;
    const ext = EXTENSION_MAP[format] || '.jpg';
    const originalSize = imageBuffer.length / 1024 / 1024;
    const convertedSize = convertedBuffer.length / 1024 / 1024;
    console.log(withTime(`✅ 변환 완료 (${originalSize.toFixed(2)}MB → ${convertedSize.toFixed(2)}MB)`));

    // 파일명 생성
    const convertedFileName = `converted${ext}`;
    const convertedR2Path = generateR2Path(convertedFileName, 'converted');

    // R2에 업로드 + DB 저장 (트랜잭션)
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
    const tenMinutesLater = expiryDate.toISOString().replace('T', ' ').substring(0, 19);

    // R2 업로드 작업을 함수로 래핑
    const imageUploadAndCleanupOperation = async () => {
      try {
        // R2에 이미지 파일 업로드
        await uploadToR2(convertedR2Path, convertedBuffer, 'application/octet-stream');
        console.log(withTime(`✅ R2 업로드 완료: ${convertedR2Path}`));

        // 업로드 성공 후 원본 파일 삭제
        try {
          await deleteFromR2(r2Path);
          console.log(withTime(`✅ 원본 파일 R2 삭제 완료: ${r2Path}`));
        } catch (deleteError) {
          console.warn(withTime(`⚠️  원본 파일 삭제 실패 (무시하고 계속): ${r2Path}`), deleteError.message);
        }

        return { success: true, r2Path: convertedR2Path };
      } catch (uploadError) {
        throw new Error(`R2 이미지 변환 작업 실패: ${uploadError.message}`);
      }
    };

    // R2 작업 + DB 저장을 트랜잭션으로 처리
    const imageResult = await safeConversionWithTransaction(db, imageUploadAndCleanupOperation, {
      fileId: fileId,
      r2Path: convertedR2Path,
      fileType: 'converted',
      expiresAt: tenMinutesLater
    });

    console.log(withTime(`\n========== 이미지 변환 완료 ==========\n`));

    res.json({
      success: true,
      fileId: fileId,
      r2Path: convertedR2Path,
      fileName: convertedFileName,
      message: `변환 완료: ${convertedFileName}`
    });
  } catch (error) {
    console.error(withTime('\n❌ 이미지 변환 실패:'), error.message);
    res.status(500).json({
      success: false,
      error: '이미지 변환에 실패했습니다.',
      details: error.message
    });
  }
});

module.exports = router;
