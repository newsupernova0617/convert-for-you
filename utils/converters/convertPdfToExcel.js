/**
 * ================================
 * 📊 PDF → Excel (.xlsx) 변환
 * ================================
 * Camelot + pandas를 사용하여 PDF에서 표를 추출해 XLSX로 저장
 */

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { randomBytes } = require('crypto');

// 플랫폼에 따라 Python 바이너리 자동 선택
const getDefaultPythonBin = () => {
  const platform = os.platform();
  return platform === 'win32' ? 'python' : 'python3';
};

const PYTHON_BIN = process.env.PDF2XLSX_PYTHON_BIN || process.env.PDF2DOCX_PYTHON_BIN || getDefaultPythonBin();
const SCRIPT_PATH = path.resolve(__dirname, 'scripts/pdf_to_xlsx.py');

async function runPdfToXlsx(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [SCRIPT_PATH, inputPath, outputPath];
    const child = spawn(PYTHON_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

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
          `PDF → Excel 변환 프로세스가 실패했습니다 (exit=${code}).${stderr ? `\n${stderr.trim()}` : ''}`
        );
        err.code = 'PDF2XLSX_CONVERSION_FAILED';
        reject(err);
      }
    });
  });
}

async function withTemporaryPaths(callback) {
  const tmpDir = path.join(os.tmpdir(), `pdf2xlsx-${randomBytes(8).toString('hex')}`);
  await fs.mkdir(tmpDir, { recursive: true });
  const inputPath = path.join(tmpDir, 'source.pdf');
  const outputPath = path.join(tmpDir, 'tables.xlsx');

  try {
    return await callback({ inputPath, outputPath, tmpDir });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * PDF를 Excel로 변환
 * @param {Buffer} pdfBuffer - PDF 파일 버퍼
 * @returns {Promise<Buffer>} 변환된 Excel 파일 버퍼
 */
async function convertPdfToExcel(pdfBuffer) {
  try {
    console.log(`📊 PDF → Excel 변환 시작`);

    const convertedBuffer = await withTemporaryPaths(async ({ inputPath, outputPath }) => {
      await fs.writeFile(inputPath, pdfBuffer);

      console.log(`🔄 python pdf_to_xlsx 변환 중...`);
      await runPdfToXlsx(inputPath, outputPath);
      console.log('✅ python pdf_to_xlsx 변환 성공');

      return fs.readFile(outputPath);
    });

    return convertedBuffer;
  } catch (error) {
    console.error('❌ PDF → Excel 변환 실패:', error.message);
    const wrapped = new Error(`PDF → Excel 변환 실패: ${error.message}`);
    wrapped.cause = error;
    throw wrapped;
  }
}

module.exports = convertPdfToExcel;
