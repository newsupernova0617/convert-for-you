const { promisify } = require('util');
const libreofficeConvert = require('libreoffice-convert');

const convertWithOptionsAsync = promisify(libreofficeConvert.convertWithOptions);

// Base64-encoded minimal single-page PDF used for capability probing
const PROBE_PDF_BASE64 =
  'JVBERi0xLjEKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1NSA+PgpzdHJlYW0KQlQgL0YxIDI0IFRmIDcyIDk2IFRkIChIZWxsbywgV29ybGQhKSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MyAwMDAwMCBuIAowMDAwMDAwMTE0IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKMDAwMDAwMDMzNCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQxMAolJUVPRgo=';

const PROBE_TIMEOUT_MS = parseInt(process.env.PDF_TO_EXCEL_PROBE_TIMEOUT_MS || '', 10) || 15000;

let pdfToExcelSupported;
let probeInFlight = null;
let lastProbeError = null;

const forceEnable = process.env.PDF_TO_EXCEL_FORCE_ENABLE === 'true';
const forceDisable = process.env.PDF_TO_EXCEL_FORCE_DISABLE === 'true';

async function runProbe() {
  if (forceEnable) {
    pdfToExcelSupported = true;
    lastProbeError = null;
    return true;
  }

  if (forceDisable) {
    pdfToExcelSupported = false;
    lastProbeError = new Error('PDF_TO_EXCEL_FORCE_DISABLE 환경 변수가 설정되었습니다.');
    return false;
  }

  const probeBuffer = Buffer.from(PROBE_PDF_BASE64, 'base64');

  try {
    const result = await convertWithOptionsAsync(
      probeBuffer,
      'xlsx',
      undefined,
      {
        fileName: 'probe.pdf',
        execOptions: { timeout: PROBE_TIMEOUT_MS },
        tmpOptions: { discardDescriptor: true },
      }
    );

    if (result && result.length > 0) {
      pdfToExcelSupported = true;
      lastProbeError = null;
      return true;
    }

    pdfToExcelSupported = false;
    lastProbeError = new Error('LibreOffice PDF → Excel 프로브 결과가 비어 있습니다.');
    return false;
  } catch (error) {
    pdfToExcelSupported = false;
    lastProbeError = error;
    return false;
  }
}

async function ensurePdfToExcelSupport() {
  if (typeof pdfToExcelSupported === 'boolean') {
    return pdfToExcelSupported;
  }

  if (probeInFlight) {
    return probeInFlight;
  }

  probeInFlight = runProbe().finally(() => {
    probeInFlight = null;
  });

  return probeInFlight;
}

function getPdfToExcelSupportStatus() {
  return {
    supported: pdfToExcelSupported === true,
    probed: typeof pdfToExcelSupported === 'boolean',
    lastError: lastProbeError,
    forceEnable,
    forceDisable,
  };
}

module.exports = {
  ensurePdfToExcelSupport,
  getPdfToExcelSupportStatus,
};
