/**
 * ================================
 * 🌐 R2 (Cloudflare) 설정
 * ================================
 * AWS SDK를 사용하여 R2와 통신
 * R2는 S3 호환 API를 제공하므로 S3 클라이언트로 사용 가능
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const requiredR2EnvKeys = ['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
const missingR2EnvKeys = requiredR2EnvKeys.filter((key) => !process.env[key]);
const isR2Configured = missingR2EnvKeys.length === 0;

const maskValue = (value) => {
  if (!value) return 'not-set';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
};

const logR2Status = () => {
  if (isR2Configured) {
    console.log(
      `🗄️  R2 연결 준비 완료 (endpoint=${process.env.R2_ENDPOINT}, bucket=${process.env.R2_BUCKET}, accessKey=${maskValue(process.env.R2_ACCESS_KEY_ID)})`
    );
  } else {
    console.warn(`⚠️  R2 환경변수 누락: ${missingR2EnvKeys.join(', ')}`);
  }
};

// R2 클라이언트 초기화
const r2Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.R2_ENDPOINT,
});

/**
 * R2에 파일 업로드
 * @param {string} key - R2에 저장될 파일 경로 (예: uploads/file-1234567890.pdf)
 * @param {Buffer|Stream} body - 파일 데이터
 * @param {string} contentType - MIME 타입 (예: application/pdf)
 * @returns {Promise} R2 업로드 응답
 */
const uploadToR2 = async (key, body, contentType = 'application/octet-stream') => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    const result = await r2Client.send(command);
    console.log(`✅ R2 업로드 성공: ${key}`);
    return {
      success: true,
      key: key,
      url: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}`,
    };
  } catch (error) {
    console.error(`❌ R2 업로드 실패: ${key}`, error);
    throw error;
  }
};

/**
 * R2에서 파일 다운로드
 * @param {string} key - R2 파일 경로
 * @returns {Promise<Buffer>} 파일 데이터
 */
const downloadFromR2 = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    });

    const response = await r2Client.send(command);

    // Stream을 Buffer로 변환
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    console.log(`✅ R2 다운로드 성공: ${key}`);
    return buffer;
  } catch (error) {
    console.error(`❌ R2 다운로드 실패: ${key}`, error);
    throw error;
  }
};

/**
 * R2에서 파일 삭제
 * @param {string} key - R2 파일 경로
 * @returns {Promise} R2 삭제 응답
 */
const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    });

    const result = await r2Client.send(command);
    console.log(`✅ R2 삭제 성공: ${key}`);
    return {
      success: true,
      key: key,
    };
  } catch (error) {
    console.error(`❌ R2 삭제 실패: ${key}`, error);
    throw error;
  }
};

/**
 * 파일 경로 생성 (타임스탐프로 충돌 방지)
 * @param {string} originalName - 원본 파일명
 * @param {string} folder - 폴더 (uploads, converted 등)
 * @returns {string} R2 저장 경로
 */
const generateR2Path = (originalName, folder = 'uploads') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  return `${folder}/${timestamp}-${random}${ext}`;
};

module.exports = {
  r2Client,
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  generateR2Path,
  isR2Configured,
  logR2Status,
};
