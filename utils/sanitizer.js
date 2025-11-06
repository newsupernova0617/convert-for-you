/**
 * 파일명 및 경로 보안 Sanitize 함수
 * XSS, Path Traversal, Injection 공격 방지
 */

/**
 * 파일명 sanitize
 * 특수문자를 제거하고 안전한 파일명으로 변환
 */
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  return filename
    // 경로 조회 시도 제거
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // 특수문자 제거 (안전한 문자만 허용)
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    // 연속된 점 제거 (예: ...tar)
    .replace(/\.{2,}/g, '.')
    // 연속된 언더스코어 정리
    .replace(/_+/g, '_')
    // 길이 제한 (255자)
    .substring(0, 255)
    // 시작/끝 점이나 공백 제거
    .trim()
    .replace(/^\.+|\.+$/g, '');
};

/**
 * R2 경로 sanitize
 * Path traversal 공격 방지
 */
const sanitizeR2Path = (path) => {
  if (!path || typeof path !== 'string') {
    return '';
  }

  return path
    // 절대 경로 제거
    .replace(/^\/+/, '')
    // 경로 조회 시도 제거
    .replace(/\.\./g, '')
    // Windows 경로 구분자 제거
    .replace(/\\/g, '/')
    // 연속된 슬래시 정리
    .replace(/\/+/g, '/')
    // 시작/끝 슬래시 제거
    .trim()
    .replace(/^\/+|\/+$/g, '');
};

/**
 * 사용자 입력 문자열 기본 sanitize
 * XSS 공격 방지
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // HTML 특수문자 escape
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // 길이 제한
    .substring(0, 1000);
};

/**
 * URL 경로 검증
 * ../../../etc/passwd 같은 경로 조회 방지
 */
const validatePath = (filePath) => {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // 경로 조회 시도 감지
  if (
    normalizedPath.includes('..') ||
    normalizedPath.startsWith('/') ||
    normalizedPath.startsWith('./')
  ) {
    return false;
  }

  return true;
};

module.exports = {
  sanitizeFilename,
  sanitizeR2Path,
  sanitizeInput,
  validatePath
};
