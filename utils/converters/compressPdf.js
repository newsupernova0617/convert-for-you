/**
 * ================================
 * PDF 압축 (Compress) 변환기
 * ================================
 * Ghostscript를 사용하여 PDF 압축
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * PDF 압축
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} quality - 압축 품질 ('high', 'medium', 'low')
 * @returns {Promise<Buffer>} 압축된 PDF 버퍼
 */
async function compressPdf(pdfBuffer, quality = 'medium') {
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const inputPath = path.join(tempDir, `pdf-compress-${timestamp}-${randomStr}-input.pdf`);
  const outputPath = path.join(tempDir, `pdf-compress-${timestamp}-${randomStr}-output.pdf`);

  try {
    console.log(`📄 PDF 압축 시작: 품질=${quality}`);

    // 품질에 따른 Ghostscript 설정
    let gsQuality;
    switch (quality) {
      case 'high':
        gsQuality = 'ebook';  // 150 DPI, 높은 품질
        break;
      case 'medium':
        gsQuality = 'screen'; // 72 DPI, 중간 품질 (기본값)
        break;
      case 'low':
        gsQuality = 'screen'; // 72 DPI, 저품질
        break;
      default:
        gsQuality = 'screen';
    }

    // 1️⃣ 임시 파일에 PDF 저장
    console.log(`  📝 임시 파일 저장`);
    fs.writeFileSync(inputPath, pdfBuffer);
    console.log(`  ✓ 입력: ${inputPath}`);

    // 2️⃣ Ghostscript로 압축
    console.log(`  🔄 Ghostscript 실행 중...`);
    await runGhostscript(inputPath, outputPath, gsQuality);
    console.log(`  ✓ 압축 완료`);

    // 3️⃣ 압축된 파일 읽기
    console.log(`  📂 압축된 파일 읽기`);
    const compressedBuffer = fs.readFileSync(outputPath);
    const originalSize = pdfBuffer.length / 1024 / 1024;
    const compressedSize = compressedBuffer.length / 1024 / 1024;
    const ratio = ((1 - compressedBuffer.length / pdfBuffer.length) * 100).toFixed(1);

    console.log(`✅ PDF 압축 완료`);
    console.log(`  원본: ${originalSize.toFixed(2)}MB`);
    console.log(`  압축: ${compressedSize.toFixed(2)}MB`);
    console.log(`  감소: ${ratio}%`);

    return compressedBuffer;
  } catch (error) {
    console.error(`❌ PDF 압축 실패: ${error.message}`);
    throw error;
  } finally {
    // 임시 파일 정리
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log(`  🗑️ 임시 파일 정리 완료`);
    } catch (err) {
      console.warn(`  ⚠️ 임시 파일 정리 실패: ${err.message}`);
    }
  }
}

/**
 * Ghostscript 실행
 * @param {string} inputPath - 입력 PDF 경로
 * @param {string} outputPath - 출력 PDF 경로
 * @param {string} quality - 품질 (ebook, screen)
 * @returns {Promise<void>}
 */
function runGhostscript(inputPath, outputPath, quality) {
  return new Promise((resolve, reject) => {
    const args = [
      '-sDEVICE=pdfwrite',
      `-dPDFSETTINGS=/${quality}`,
      '-dCompatibilityLevel=1.4',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dDetectDuplicateImages',
      '-r150',                          // 150 DPI
      '-dCompressFonts=true',
      '-r150x150',
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    const gs = spawn('gs', args);
    let stderr = '';

    gs.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gs.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Ghostscript 실패 (코드: ${code}): ${stderr}`));
      }
    });

    gs.on('error', (err) => {
      reject(new Error(`Ghostscript 프로세스 오류: ${err.message}`));
    });

    // 타임아웃 설정 (60초)
    setTimeout(() => {
      gs.kill();
      reject(new Error('Ghostscript 타임아웃 (60초)'));
    }, 60000);
  });
}

module.exports = { compressPdf };
