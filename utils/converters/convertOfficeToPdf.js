/**
 * ================================
 * 📄 Office → PDF 변환
 * ================================
 * LibreOffice를 사용하여 Office 문서를 PDF로 변환
 */

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { randomBytes } = require('crypto');

const PYTHON_SCRIPT = path.join(__dirname, 'scripts', 'office_to_pdf.py');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

async function runPythonScript(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [PYTHON_SCRIPT, inputPath, outputPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Python 스크립트 실행 실패: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const err = new Error(
          `Office → PDF 변환 실패 (exit=${code}).${stderr ? `\n${stderr.trim()}` : ''}`
        );
        err.code = 'OFFICE_TO_PDF_CONVERSION_FAILED';
        reject(err);
      }
    });
  });
}

async function withTemporaryPaths(callback) {
  const tmpDir = path.join(os.tmpdir(), `office2pdf-${randomBytes(8).toString('hex')}`);
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    return await callback(tmpDir);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Office 문서를 PDF로 변환
 * @param {Buffer} officeBuffer - Office 파일 버퍼 (docx/xlsx/pptx)
 * @param {string} format - 입력 파일 형식 ('word', 'excel', 'ppt')
 * @returns {Promise<Buffer>} 변환된 PDF 파일 버퍼
 */
async function convertOfficeToPdf(officeBuffer, format) {
  try {
    console.log(`📄 Office (${format.toUpperCase()}) → PDF 변환 시작`);

    const pdfBuffer = await withTemporaryPaths(async (tmpDir) => {
      // 입력 파일 확장자 결정
      const extMap = {
        'word': '.docx',
        'excel': '.xlsx',
        'ppt': '.pptx'
      };

      const ext = extMap[format];
      if (!ext) {
        throw new Error(`지원하지 않는 형식입니다: ${format}`);
      }

      const inputPath = path.join(tmpDir, `input${ext}`);
      const outputPath = path.join(tmpDir, 'output.pdf');

      // 1. Office 파일 저장
      await fs.writeFile(inputPath, officeBuffer);
      console.log(`✅ ${format.toUpperCase()} 파일 저장 완료`);

      // 2. Python 스크립트로 LibreOffice 호출하여 PDF 변환
      console.log('🔄 LibreOffice로 PDF 변환 중...');
      await runPythonScript(inputPath, outputPath);
      console.log('✅ PDF 변환 성공');

      // 3. 변환된 PDF 읽기
      const buffer = await fs.readFile(outputPath);
      console.log(`✅ PDF 파일 읽기 완료 (${(buffer.length / 1024).toFixed(2)} KB)`);

      return buffer;
    });

    console.log(`✅ Office → PDF 변환 완료`);
    return pdfBuffer;
  } catch (error) {
    console.error(`❌ Office → PDF 변환 실패:`, error.message);
    const wrapped = new Error(`Office → PDF 변환 실패: ${error.message}`);
    wrapped.cause = error;
    throw wrapped;
  }
}

module.exports = convertOfficeToPdf;
