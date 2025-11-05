/**
 * ================================
 * 🖼️ PDF → Image (JPG/PNG) 변환
 * ================================
 * pdftoppm (Poppler) + Sharp를 사용하여 모든 페이지를 이미지로 변환하고 ZIP으로 압축
 */

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { randomBytes } = require('crypto');
const sharp = require('sharp');
const archiver = require('archiver');
const { createWriteStream } = require('fs');

const PDFTOPPM_BIN = process.env.PDFTOPPM_BIN || 'pdftoppm';

async function runPdftoppm(inputPath, outputBase) {
  return new Promise((resolve, reject) => {
    // -singlefile 제거하여 모든 페이지 변환
    const args = ['-png', '-r', '300', inputPath, outputBase];
    const child = spawn(PDFTOPPM_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const err = new Error(
          `pdftoppm 변환이 실패했습니다 (exit=${code}).${stderr ? `\n${stderr.trim()}` : ''}`
        );
        err.code = 'PDFTOPPM_CONVERSION_FAILED';
        reject(err);
      }
    });
  });
}

async function withTemporaryPaths(callback) {
  const tmpDir = path.join(os.tmpdir(), `pdf2img-${randomBytes(8).toString('hex')}`);
  await fs.mkdir(tmpDir, { recursive: true });
  const inputPath = path.join(tmpDir, 'source.pdf');
  const outputBase = path.join(tmpDir, 'page');
  const zipPath = path.join(tmpDir, 'output.zip');

  try {
    return await callback({ inputPath, outputBase, tmpDir, zipPath });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function getAllPngFiles(outputBase) {
  const tmpDir = path.dirname(outputBase);
  const files = await fs.readdir(tmpDir);

  // outputBase-XXXX.png 형식의 파일들 찾기
  const baseName = path.basename(outputBase);
  const pngFiles = files
    .filter(f => f.startsWith(baseName) && f.endsWith('.png'))
    .sort((a, b) => {
      // 파일명에서 페이지 번호 추출하여 정렬
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    })
    .map(f => path.join(tmpDir, f));

  return pngFiles;
}

async function optimizeImage(imageBuffer, format) {
  if (format === 'jpg') {
    return await sharp(imageBuffer)
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();
  } else if (format === 'png') {
    return await sharp(imageBuffer)
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
  return imageBuffer;
}

async function createZipFromImages(pngFiles, format, zipPath) {
  return new Promise(async (resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    try {
      for (let i = 0; i < pngFiles.length; i++) {
        const pngPath = pngFiles[i];
        let imageBuffer = await fs.readFile(pngPath);

        // 이미지 최적화
        imageBuffer = await optimizeImage(imageBuffer, format);

        // ZIP에 추가 (파일명: page-001.jpg, page-002.jpg, ...)
        const fileName = `page-${String(i + 1).padStart(3, '0')}.${format}`;
        archive.append(imageBuffer, { name: fileName });
      }

      await archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * PDF를 모든 페이지의 이미지로 변환하여 ZIP 파일로 반환
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @param {string} format - 변환 형식 ('jpg' 또는 'png')
 * @returns {Promise<Buffer>} 변환된 이미지 ZIP 파일 버퍼
 */
async function convertPdfToImage(pdfBuffer, format) {
  try {
    console.log(`🖼️ PDF → ${format.toUpperCase()} (ZIP) 변환 시작`);

    const zipBuffer = await withTemporaryPaths(async ({ inputPath, outputBase, zipPath }) => {
      // 1. PDF를 파일로 저장
      await fs.writeFile(inputPath, pdfBuffer);
      console.log('✅ PDF 파일 저장 완료');

      // 2. pdftoppm으로 모든 페이지를 PNG로 변환
      console.log('🔄 pdftoppm으로 모든 페이지 PNG 변환 중...');
      await runPdftoppm(inputPath, outputBase);
      console.log('✅ pdftoppm 변환 성공');

      // 3. 생성된 PNG 파일들 조회
      const pngFiles = await getAllPngFiles(outputBase);
      console.log(`📊 총 ${pngFiles.length}개 페이지 변환됨`);

      if (pngFiles.length === 0) {
        throw new Error('PDF 변환 결과 이미지 파일이 생성되지 않았습니다');
      }

      // 4. ZIP 파일 생성
      console.log(`📦 ZIP 파일 생성 중... (${format.toUpperCase()} 최적화)`);
      await createZipFromImages(pngFiles, format, zipPath);
      console.log('✅ ZIP 파일 생성 완료');

      // 5. ZIP 파일을 버퍼로 읽기
      const buffer = await fs.readFile(zipPath);
      return buffer;
    });

    console.log(`✅ 이미지 변환 완료: ${format.toUpperCase()} ZIP`);
    return zipBuffer;
  } catch (error) {
    console.error(`❌ PDF → ${format.toUpperCase()} 변환 실패:`, error.message);
    const wrapped = new Error(`PDF → ${format.toUpperCase()} 변환 실패: ${error.message}`);
    wrapped.cause = error;
    throw wrapped;
  }
}

module.exports = convertPdfToImage;
