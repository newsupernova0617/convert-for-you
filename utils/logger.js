/**
 * ================================
 * 📅 한국 시간 로거 유틸리티
 * ================================
 * 모든 console.log에 한국 시간을 표시
 */

/**
 * 한국 시간으로 포매팅된 현재 시각 반환
 * @returns {string} 형식: [YYYY-MM-DD HH:mm:ss]
 */
const getKoreanTime = () => {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

  const year = koreaTime.getFullYear();
  const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
  const date = String(koreaTime.getDate()).padStart(2, '0');
  const hours = String(koreaTime.getHours()).padStart(2, '0');
  const minutes = String(koreaTime.getMinutes()).padStart(2, '0');
  const seconds = String(koreaTime.getSeconds()).padStart(2, '0');

  return `[${year}-${month}-${date} ${hours}:${minutes}:${seconds}]`;
};

/**
 * 한국 시간이 포함된 로그 메시지 생성
 * @param {string} message 로그 메시지
 * @returns {string} 시간이 포함된 메시지
 */
const withTime = (message) => {
  return `${getKoreanTime()} ${message}`;
};

module.exports = {
  getKoreanTime,
  withTime
};
