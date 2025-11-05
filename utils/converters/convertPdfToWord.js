/**
 * ================================
 * 📄 PDF → Word (.docx) 변환
 * ================================
 * pdf2docx(Python)를 호출하여 PDF를 Word로 변환
 */

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { randomBytes } = require('crypto');

const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || 'python3';
const SCRIPT_PATH = path.resolve(__dirname, 'scripts/pdf_to_docx.py');

async function runPdf2Docx(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [SCRIPT_PATH, inputPath, outputPath];
    const child = spawn(PYTHON_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      // pdf2docx는 진행 상황을 stdout에 출력하기도 하지만 굳이 로그로 노출하지 않음
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const err = new Error(
          `pdf2docx 변환 프로세스가 실패했습니다 (exit=${code}).${stderr ? `\n${stderr.trim()}` : ''}`
        );
        err.code = 'PDF2DOCX_CONVERSION_FAILED';
        reject(err);
      }
    });
  });
}

async function withTemporaryPaths(callback) {
  const tmpDir = path.join(os.tmpdir(), `pdf2docx-${randomBytes(8).toString('hex')}`);
  await fs.mkdir(tmpDir, { recursive: true });
  const inputPath = path.join(tmpDir, 'source.pdf');
  const outputPath = path.join(tmpDir, 'result.docx');

  try {
    return await callback({ inputPath, outputPath, tmpDir });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
/**
 * PDF를 Word로 변환
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @returns {Promise<Buffer>} 변환된 Word 파일 버퍼
 */
async function convertPdfToWord(pdfBuffer) {

  try {
    console.log(`📝 PDF → Word 변환 시작`);

    const convertedBuffer = await withTemporaryPaths(async ({ inputPath, outputPath }) => {
      await fs.writeFile(inputPath, pdfBuffer);

      console.log(`🔄 pdf2docx 변환 중...`);
      await runPdf2Docx(inputPath, outputPath);
      console.log('✅ pdf2docx 변환 성공');

      return fs.readFile(outputPath);
    });

    return convertedBuffer;
  } catch (error) {
    console.error('❌ PDF → Word 변환 실패:', error.message);
    const wrapped = new Error(`PDF → Word 변환 실패: ${error.message}`);
    wrapped.cause = error;
    throw wrapped;
  }
}

module.exports = convertPdfToWord;
