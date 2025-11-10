# Convert4U - Media Conversion Platform - Documentation

## Project Overview

**Convert4U**는 28+ 파일 형식을 변환하는 풀스택 웹 애플리케이션입니다.

### 지원 형식
- **PDF**: Word/Excel/PPT로 변환 + 이미지 추출(ZIP)
- **Office**: Word/Excel/PPT → PDF
- **PDF 관리**: 병합, 분할, 압축
- **이미지**: JPG↔PNG, JPG/PNG↔WEBP, HEIC→* (9개)
- **이미지 도구**: 리사이즈, 압축
- **오디오**: MP3, WAV, OGG, M4A, AAC (5개)
- **비디오**: MP4, MOV, WebM, MKV + 압축 + GIF

### 핵심 기능
- 드래그앤드롭 업로드 (매직 넘버 검증)
- 실시간 변환 (Piscina 워커)
- Cloudflare R2 클라우드 저장소
- 관리자 대시보드 (JWT 인증)
- 4가지 레이트 리미팅
- 자동 파일 정리 (10분 만료)
- 89개 전용 변환 페이지

### 기술 스택
```
Backend: Node.js, Express, SQLite, Piscina, LibreOffice, FFmpeg, Python
Frontend: Bootstrap 5, Alpine.js, Vanilla JS
Storage: Cloudflare R2 (S3 호환)
Database: SQLite WAL 모드
Auth: JWT (1시간 만료)
```

---

## 디렉토리 구조

```
convert_own/
├── config/              # 설정
│   ├── auth.js         # JWT 인증
│   ├── db.js           # SQLite 초기화
│   ├── r2.js           # R2 스토리지 클라이언트
│   └── rateLimiter.js  # 레이트 리미팅
│
├── middlewares/
│   └── upload.js       # Multer + 매직 넘버 검증
│
├── routes/             # API 라우트
│   ├── uploadRoutes.js    # POST /api/upload
│   ├── convertRoutes.js   # POST /api/convert (692줄)
│   ├── downloadRoutes.js  # GET /api/download/:fileId
│   └── adminRoutes.js     # 관리자 API
│
├── utils/
│   ├── constants.js       # 상수 & 형식 맵핑
│   ├── converterPool.js   # Piscina 워커 풀 (142줄)
│   ├── dbTransaction.js   # DB 트랜잭션 (239줄)
│   ├── scheduler.js       # 자동 정리 (108줄, 2분 간격)
│   ├── logger.js          # 한국 시간 포맷팅
│   ├── sanitizer.js       # 보안 함수
│   ├── dashboard.js       # 통계 모듈 (150+ 줄)
│   └── converters/        # 변환 구현
│       ├── converter.task.js  # Piscina 워커 진입점
│       ├── convertPdf*.js     # PDF 변환 (Word/Excel/PPT/Image)
│       ├── convertOffice*.js  # Office → PDF
│       ├── convertImage.js    # 이미지 변환
│       ├── convertHeic.js     # HEIC 변환
│       ├── resizeImage.js     # 리사이즈
│       ├── compress*.js       # PDF/이미지 압축
│       ├── mergePdf.js        # PDF 병합
│       ├── splitPdf.js        # PDF 분할
│       ├── convertAudio.js    # 오디오 변환 (FFmpeg)
│       ├── convertVideo.js    # 비디오 변환 (FFmpeg)
│       ├── convertVideoToGif.js
│       └── scripts/           # Python 변환 스크립트
│
├── public/             # 프론트엔드 (89개 HTML)
│   ├── index.html           # 랜딩페이지
│   ├── admin.html           # 관리자 대시보드
│   ├── script.js            # Alpine.js 스토어 (13KB)
│   ├── styles.css           # 스타일 (15KB)
│   ├── admin/
│   │   ├── script.js
│   │   └── styles.css
│   └── [PDF변환5개, Office2PDF3개, PDF관리3개, 이미지9개,
│        이미지도구2개, 오디오5개, 비디오5개, 비디오도구2개].html
│
├── __tests__/          # Jest 테스트
│   ├── server.test.js
│   ├── upload.test.js
│   ├── convert.test.js
│   ├── download.test.js
│   └── database.test.js
│
├── db/
│   ├── database.db
│   ├── database.db-shm  # WAL 공유메모리
│   └── database.db-wal  # WAL 트랜잭션 로그
│
├── .env                # 환경변수
├── package.json        # 의존성
├── server.js           # Express 진입점 (205줄)
├── jest.config.js      # Jest 설정
└── CLAUDE.md          # 이 문서
```

---

## 데이터베이스 스키마

### Files 테이블
```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY,
  file_id TEXT UNIQUE,           -- {timestamp}-{random}
  r2_path TEXT,                  -- R2 저장소 경로
  file_type TEXT,                -- 'converted'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,           -- created_at + 10분
  deleted_at DATETIME,           -- 삭제 시간
  status TEXT DEFAULT 'active'   -- 'active'/'deleted'/'failed'
);

CREATE INDEX idx_file_id ON files(file_id);
CREATE INDEX idx_expires_at ON files(expires_at);
CREATE INDEX idx_status ON files(status);
```

### DB 설정 (PRAGMA)
```javascript
PRAGMA journal_mode = WAL;      // 쓰기 중 읽기 가능
PRAGMA synchronous = NORMAL;    // 속도 & 안전 균형
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -2000;      // ~2MB 캐시
PRAGMA auto_vacuum = FULL;
```

### 파일 생명주기
1. **업로드**: R2 `uploads/` 폴더
2. **변환**: R2에서 다운로드 → Piscina 워커 처리 → R2 `converted/` 업로드
3. **DB**: `status='active'`, `expires_at=now+10분` 레코드 생성
4. **다운로드**: `/api/download/:fileId`
5. **정리**: 스케줄러 2분마다 만료된 파일 R2 삭제 + DB 업데이트

---

## API 엔드포인트

### 1. POST `/api/upload`
파일을 R2에 업로드합니다.

**요청**:
```
Content-Type: multipart/form-data
Body: file (PDF, Office, 이미지, 오디오, 비디오)
```

**응답 (성공)**:
```json
{
  "success": true,
  "fileName": "document.pdf",
  "r2Path": "uploads/1733367890123-abc123.pdf",
  "size": 1024000,
  "url": "https://r2.example.com/uploads/..."
}
```

**검증**: MIME 타입 + 매직 넘버 + 50MB 제한
**레이트 리미팅**: 50/15분

---

### 2. POST `/api/convert`
파일을 변환합니다.

**요청**:
```json
{
  "r2Path": "uploads/1733367890123-abc123.pdf",
  "format": "word|excel|ppt|jpg|png|word2pdf|...|mp3|...|mp4|...",
  "originalName": "document.pdf",
  "additionalData": {
    "pages": "1-5",        // split 형식
    "files": ["file1"],    // merge 형식
    "quality": 80,         // 이미지/비디오 압축
    "width": 800,          // 리사이즈
    "bitrate": "192k"      // 오디오/비디오
  }
}
```

**응답 (성공)**:
```json
{
  "success": true,
  "fileId": "1733367890456-def456",
  "r2Path": "converted/1733367890456-def456.docx",
  "fileName": "document_converted.docx",
  "message": "변환 완료: document_converted.docx"
}
```

**변환 흐름** (5단계):
```
1. R2에서 파일 다운로드
2. Piscina 워커로 변환 처리
3. 출력 파일명 생성 (새니타이즈)
4. R2에 변환된 파일 업로드 (트랜잭션)
5. DB에 파일 정보 저장 (10분 만료)
```

**레이트 리미팅**: 50/15분

---

### 3. GET `/api/download/:fileId`
변환된 파일을 다운로드합니다.

**요청**: `/api/download/1733367890456-def456`

**응답 (성공)**:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="..."
Body: 바이너리 파일 데이터
```

---

## 관리자 시스템

### JWT 인증 (`config/auth.js`)
```javascript
{
  payload: {
    role: 'admin',
    iat: 발급시간,
    exp: 발급시간 + 1시간
  },

  generateToken(payload)    // JWT 생성
  verifyToken(token)        // 검증
  refreshToken(oldToken)    // 갱신
  isTokenValid(token)       // 유효성 확인
}
```

### 관리자 API (`routes/adminRoutes.js`)

| 엔드포인트 | 메서드 | 인증 | 목적 |
|-----------|--------|------|------|
| `/api/admin/login` | POST | 암호 | 로그인 |
| `/api/admin/refresh` | POST | JWT | 토큰 갱신 |
| `/api/admin/stats` | GET | JWT | 통계 |
| `/api/admin/files` | GET | JWT | 파일 목록 |
| `/api/admin/files/:fileId` | GET | JWT | 파일 상세 |
| `/api/admin/status` | GET | JWT | 시스템 상태 |
| `/api/admin/deleted` | GET | JWT | 삭제된 파일 목록 |

**로그인 흐름**:
```
1. POST /api/admin/login {password}
2. ADMIN_PASSWORD 검증
3. JWT 토큰 생성 (1시간 만료)
4. {token, expiresIn} 반환
5. 클라이언트 localStorage에 저장
6. Authorization 헤더에 포함
```

**레이트 리미팅**: 5/15분

### 관리자 대시보드 (`public/admin.html`)
- 통계 (총/오늘/7일/30일)
- 형식별 분석
- 시간별 timeline
- 파일 관리 (검색, 페이지네이션)
- 시스템 상태 (CPU, 메모리, DB 크기)
- 삭제된 파일 감사 추적
- JWT 자동 갱신

---

## 파일 변환기

### `utils/converterPool.js` - Piscina 워커 풀

**설정** (142줄):
```javascript
const pool = new Piscina({
  filename: 'converters/converter.task.js',
  minThreads: 2,
  maxThreads: CPU 코어 수,
  taskTimeout: 300000,              // 5분
  idleTimeout: 30000,               // 30초 미사용시 종료
  concurrentTasksPerWorker: 1       // CPU 바운드
});
```

**함수**:
- `convert(fileBuffer, format, additionalData)` - 작업 제출
- `getStats()` - 풀 설정 반환
- `destroy()` - 정상 종료

---

### `utils/converters/converter.task.js` - 워커 진입점

```javascript
switch(format) {
  // PDF 내보내기
  case 'word': return convertPdfToWord(fileBuffer)
  case 'excel': return convertPdfToExcel(fileBuffer)
  case 'ppt': return convertPdfToPpt(fileBuffer)
  case 'jpg': return convertPdfToImage(fileBuffer, 'jpg')
  case 'png': return convertPdfToImage(fileBuffer, 'png')

  // Office → PDF
  case 'word2pdf': return convertOfficeToPdf(fileBuffer, 'word')
  case 'excel2pdf': return convertOfficeToPdf(fileBuffer, 'excel')
  case 'ppt2pdf': return convertOfficeToPdf(fileBuffer, 'ppt')

  // PDF 관리
  case 'merge': return mergePdf(additionalData.pdfBuffers)
  case 'split': return splitPdf(fileBuffer, additionalData.ranges)
  case 'compress': return compressPdf(fileBuffer)

  // 이미지 변환 (9개)
  case 'jpg-to-png': return convertImage(fileBuffer, 'png')
  case 'png-to-jpg': return convertImage(fileBuffer, 'jpg')
  case 'jpg-to-webp': return convertImage(fileBuffer, 'webp')
  case 'png-to-webp': return convertImage(fileBuffer, 'webp')
  case 'webp-to-jpg': return convertImage(fileBuffer, 'jpg')
  case 'webp-to-png': return convertImage(fileBuffer, 'png')
  case 'heic-to-jpg': return convertImage(fileBuffer, 'jpg')
  case 'heic-to-png': return convertImage(fileBuffer, 'png')
  case 'heic-to-webp': return convertImage(fileBuffer, 'webp')

  // 이미지 도구
  case 'resize': return resizeImage(fileBuffer, additionalData)
  case 'compress-image': return compressImage(fileBuffer)

  // 오디오 (5개)
  case 'mp3': return convertAudio(fileBuffer, 'mp3', additionalData.bitrate)
  case 'wav': return convertAudio(fileBuffer, 'wav', additionalData.bitrate)
  case 'ogg': return convertAudio(fileBuffer, 'ogg', additionalData.bitrate)
  case 'm4a': return convertAudio(fileBuffer, 'm4a', additionalData.bitrate)
  case 'aac': return convertAudio(fileBuffer, 'aac', additionalData.bitrate)

  // 비디오 (5개)
  case 'mp4': return convertVideo(fileBuffer, 'mp4', additionalData.quality)
  case 'mov': return convertVideo(fileBuffer, 'mov', additionalData.quality)
  case 'webm': return convertVideo(fileBuffer, 'webm', additionalData.quality)
  case 'mkv': return convertVideo(fileBuffer, 'mkv', additionalData.quality)

  // 비디오 도구
  case 'compress-video': return compressVideo(fileBuffer, additionalData)
  case 'gif': return convertVideoToGif(fileBuffer, additionalData)
}
```

---

### 주요 변환 모듈

#### `convertPdfToImage.js` - PDF → JPG/PNG (ZIP)
**프로세스**:
```
PDF → pdftoppm (300 DPI) → PNG 파일들
→ Sharp 최적화 (JPG: 품질 90, PNG: 압축 9)
→ Archiver ZIP 생성
→ page-001.jpg, page-002.jpg, ... (0패딩)
```

#### `convertImage.js` - 이미지 형식 변환
**Sharp 품질 설정**:
- JPG: 품질 90, 프로그레시브
- PNG: 압축 레벨 9 (최대)
- WEBP: 품질 80

#### `convertAudio.js` - 오디오 변환 (FFmpeg)
**기본 비트레이트**:
- MP3: 192 kbps
- WAV: 320 kbps (무손실)
- OGG: 128 kbps
- M4A: 192 kbps
- AAC: 192 kbps

#### `convertVideo.js` - 비디오 변환 (FFmpeg)
**품질 프리셋**:
- High: 2000+ kbps, 30 fps
- Medium: 1000 kbps, 25 fps
- Low: 500 kbps, 20 fps

#### `convertVideoToGif.js` - 비디오 → GIF
- 10 fps로 프레임 추출
- 600x400 최대 해상도
- 파일 크기: 2-10 MB

---

## 프론트엔드

### 랜딩페이지 (`public/index.html`)
**5개 탭 네비게이션**:
1. 📄 PDF 변환 (5개 변환기)
2. 🔧 PDF 관리 (3개 도구)
3. 📊 Office → PDF (3개)
4. 🖼️ 이미지 변환 (11개)
5. 🎵 오디오 & 비디오 (12개)

**기술**: Bootstrap 5.3.0, Alpine.js 3.x, Vanilla JS

### 스크립트 아키텍처 (`public/script.js` - 13KB)

**Alpine.js 스토어** (`Alpine.store('upload')`):
```javascript
{
  // 상태
  selectedFile: File | null,
  uploadedR2Path: string | null,
  isConverting: boolean,
  isCompleted: boolean,
  isDragover: boolean,
  convertedFileId: string | null,
  convertedFileName: string,
  errorMessage: string,

  // 메서드
  setFile(file),              // 검증 & 업로드
  startConvert(format),       // 변환 시작
  download(),                 // 다운로드
  reset()                     // 초기화
}
```

**API 함수**:
- `validateFile(file)` - MIME 타입 확인
- `uploadFile(file, store)` - POST /api/upload
- `convertFile(r2Path, format, additionalData, store)` - POST /api/convert
- `downloadFile(fileId, fileName)` - GET /api/download/:fileId

**기능**:
- 드래그앤드롭 업로드
- 파일 타입 검증
- 실시간 UI 업데이트
- 에러 처리
- 자동 다운로드 정리
- 진행 상황 추적

---

## 핵심 의존성

### Express (^4.18.2)
```javascript
app.use(helmet({...}));        // 보안 헤더
app.use(cors());               // CORS
app.use(morgan('dev'));        // HTTP 로깅
app.use(express.json());       // JSON 파싱
app.use(compression());        // gzip 압축
app.use(rateLimit);            // 레이트 리미팅
```

### SQLite (better-sqlite3 ^12.4.1)
- 동기 API (콜백 지옥 없음)
- 높은 동시성 성능
- 내장 트랜잭션 지원
- WAL 모드로 리더/라이터 동시 실행

### Multer (^2.0.2)
- 메모리 기반 저장소
- MIME 타입 필터
- 매직 넘버 검증
- 50MB 크기 제한

### file-type (^18.7.0)
- 실제 파일 내용 검증 (확장자 아님)
- 파일 스푸핑 방지
- 손상된 파일 감지

### FFmpeg / fluent-ffmpeg (^2.1.3)
오디오/비디오 변환

### Sharp (^0.34.4)
이미지 최적화 및 압축 (30-50% 크기 감소)

### Cloudflare R2 (AWS SDK @aws-sdk/client-s3 ^3.500.0)
S3 호환 클라우드 저장소 (무송금 요금)

### Piscina (^5.1.3)
워커 스레드 풀 (CPU 집약적 작업)

---

## 보안 & 설정

### Rate Limiting (express-rate-limit)

| 정책 | 라우트 | 제한 | 기간 | 목적 |
|-----|--------|------|------|------|
| General | `/api/*` | 100 | 15분 | 전체 API |
| Upload | `/api/upload` | 50 | 15분 | 업로드 스팸 방지 |
| Convert | `/api/convert` | 50 | 15분 | 변환 스팸 방지 |
| Admin | `/api/admin/login` | 5 | 15분 | 브루트포스 방지 |

### 파일 정리 & 만료

- **전략**: 시간 기반 만료 (변환 후 10분)
- **실행**: 스케줄러 2분마다 실행
- **확인**: DB 쿼리 `expires_at <= NOW()` with `status='active'`
- **원자성**: R2 삭제 + DB 업데이트 트랜잭션
- **실패 처리**: 실패시 `status='failed'` 표시

### Helmet 보안 헤더
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- Referrer Policy

### 입력 새니타이제이션
- **파일명**: `../` 제거, 특수문자 제거, 255자 제한
- **R2 경로**: 절대 경로 & 디렉토리 순회 방지
- **사용자 입력**: HTML 이스케이프 (XSS 방지)
- **매직 넘버**: 실제 파일 내용 검증

### 환경변수
```bash
# 서버
PORT=3002
NODE_ENV=development

# 파일
MAX_FILE_SIZE=52428800          # 50MB
MAX_MERGE_SIZE=104857600        # 100MB
FILE_EXPIRY_MINUTES=10
SCHEDULER_INTERVAL_MINUTES=2

# 변환
CONVERTER_MIN_THREADS=2
CONVERTER_MAX_THREADS=CPU 코어 수
CONVERTER_TIMEOUT=300000        # 5분

# DB
DB_PATH=./db/database.db

# R2
R2_ENDPOINT=https://{account-id}.r2.cloudflarestorage.com
R2_BUCKET=convert-for-you
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# 인증
ADMIN_PASSWORD=...
JWT_SECRET=...

# CORS
CORS_ORIGIN=http://localhost:3002

# Google AdSense
ADSENSE_PUBLISHER_ID=ca-pub-...
```

---

## 테스트 (`jest`)

### 테스트 파일 (5개)
- `__tests__/server.test.js` - 서버 초기화
- `__tests__/upload.test.js` - 업로드 기능
- `__tests__/convert.test.js` - 변환 (28+ 형식)
- `__tests__/download.test.js` - 다운로드
- `__tests__/database.test.js` - DB 작업

### 실행
```bash
npm test              # 모두 실행
npm run test:watch   # 감시 모드
npm run test:coverage # 커버리지
npm test -- upload.test.js  # 특정 파일
```

---

## 모니터링 & 로깅

### 콘솔 출력 예제

**업로드 성공**:
```
[2024-11-06 19:48:00] ✅ R2 업로드 성공: uploads/1733367890123-abc123.pdf
```

**변환 프로세스**:
```
[2024-11-06 19:49:00] ========== 파일 변환 시작 ==========
[2024-11-06 19:49:01] [1/5] 📥 R2에서 PDF 파일 다운로드
[2024-11-06 19:49:02] ✅ 다운로드 완료 (1.23MB)
[2024-11-06 19:49:03] [2/5] 🔄 Piscina에서 변환 작업 실행
[2024-11-06 19:49:15] ✅ 변환 완료 (0.89MB)
[2024-11-06 19:49:16] [3/5] 📝 파일명 생성
[2024-11-06 19:49:17] [4/5] 📤 R2에 변환된 파일 업로드
[2024-11-06 19:49:18] [5/5] 💾 DB에 파일 정보 저장
[2024-11-06 19:49:19] ========== 변환 완료 ==========
```

**스케줄러 정리**:
```
[2024-11-06 19:51:00] 🔍 만료된 파일 정리 시작...
[2024-11-06 19:51:01] ⏰ 만료된 파일 3개 발견
[2024-11-06 19:51:02] 🗑️ R2에서 삭제: converted/1733367890456-def456.docx
[2024-11-06 19:51:05] ✅ 완료: 1733367890456-def456
[2024-11-06 19:51:07] 🎉 정리 완료 (3건 성공, 0건 실패)
```

---

## 성능 최적화

### DB 최적화
- WAL 모드: 쓰기 중 읽기 가능 (논블로킹)
- 메모리 캐시: 2MB 페이지 캐시
- 인덱스: file_id, expires_at, status
- 동기 API: better-sqlite3 콜백 오버헤드 제거

### 변환 최적화
- Piscina: 멀티스레드 처리 (CPU 집약적)
- 메모리 저장소: 업로드 디스크 I/O 없음
- 스트리밍: FFmpeg로 비디오/오디오 (메모리 오버플로우 방지)
- 이미지 압축: Sharp로 30-50% 크기 감소
- 병렬 처리: Piscina로 동시 변환

### 네트워크 최적화
- gzip 압축: 응답 크기 감소
- CDN: Bootstrap & Alpine.js (CDN 사용)
- 캐싱: Express.static 캐싱 헤더
- R2 효율: 무송금 요금

### 프론트엔드 최적화
- Alpine.js: 경량 프레임워크 (~60KB)
- 지연 컴포넌트: x-if로 템플릿 렌더링
- 최소 JS: ~13KB 앱 코드
- CSS: Bootstrap 5 + 최소 커스텀 (~15KB)
- 탭 UI: 단일 페이지 네비게이션 (전체 페이지 리로드 없음)

---

## 배포

### 시스템 요구사항
- Node.js 16+
- LibreOffice CLI (`apt-get install libreoffice`)
- FFmpeg (`apt-get install ffmpeg`)
- RAM: 2GB+ (워커 + 동시 변환)
- 디스크: 1GB+ (임시 파일)
- Cloudflare R2 계정

### 환경 설정
```bash
npm install
cp .env.example .env
nano .env
node -e "require('./config/db')"
npm start          # 프로덕션
npm run dev       # 개발 (auto-reload)
```

### 프로덕션 체크리스트
- NODE_ENV=production
- PORT 설정 (예: 8080)
- R2 자격증명 설정
- CONVERTER_MAX_THREADS = CPU 코어 수
- CORS_ORIGIN 설정
- JWT_SECRET & ADMIN_PASSWORD 강화
- HTTPS/TLS 활성화
- 모니터링 & 에러 추적
- SQLite DB 백업 전략
- 로그 수집
- 28+ 형식 모두 테스트
- CDN 정적 자산 설정

### Docker
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache libreoffice ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

---

## 일반적인 문제 & 해결

### 변환 타임아웃
- CONVERTER_TIMEOUT 증가 (기본: 5분)
- CONVERTER_MAX_THREADS 감소
- LibreOffice/FFmpeg 설치 확인: `which libreoffice` / `which ffmpeg`

### R2 업로드 실패
- R2 자격증명 확인
- 버킷 이름 확인
- 스토리지 공간 확인 (프리: 10GB)
- IAM 권한 확인

### 파일 미정리
- 스케줄러 실행 확인 (콘솔 로그)
- DB 확인: `SELECT * FROM files WHERE status='active'`
- expires_at 값 확인
- R2 삭제 권한 확인

### 높은 메모리 사용
- CONVERTER_MAX_THREADS 감소 (기본 = CPU 코어 수)
- 큰 파일 스트리밍 구현
- Piscina 워커 생명주기 모니터링
- 임시 파일 정리: `rm -rf /tmp/pdf-to-*`

### 관리자 로그인 실패
- ADMIN_PASSWORD 환경변수 확인
- JWT_SECRET 강화 (32자+)
- 브라우저 localStorage 정리
- 서버 로그 JWT 에러 확인
- 레이트 리미팅: 최대 5회/15분

---

## API 참조 요약

| 엔드포인트 | 메서드 | 인증 | 레이트 | 반환 |
|----------|--------|------|--------|------|
| `/api/upload` | POST | 없음 | 50/15분 | `{success, fileName, r2Path, size, url}` |
| `/api/convert` | POST | 없음 | 50/15분 | `{success, fileId, r2Path, fileName}` |
| `/api/download/:fileId` | GET | 없음 | 100/15분 | 바이너리 파일 |
| `/api/admin/login` | POST | 암호 | 5/15분 | `{token, expiresIn}` |
| `/api/admin/refresh` | POST | JWT | 100/15분 | `{token, expiresIn}` |
| `/api/admin/stats` | GET | JWT | 100/15분 | `{total, today, formatStats, ...}` |
| `/api/admin/files` | GET | JWT | 100/15분 | `{files: [...], page, total}` |
| `/api/admin/status` | GET | JWT | 100/15분 | `{uptime, cpu, memory, dbSize, ...}` |
| `/test` | GET | 없음 | 100/15분 | `{message}` |

---

## 파일 크기 가이드

| 형식 | 입력 | 출력 | 비고 |
|-----|------|------|------|
| PDF | 1-50MB | 다양 | 소스 |
| DOCX | 1-50MB | 0.5-2x | 보통 PDF보다 작음 |
| XLSX | 1-50MB | 0.3-1x | 테이블에 따라 |
| PPTX | 1-50MB | 0.5-3x | 큰 이미지 영향 |
| JPG (ZIP) | 1-50MB | 0.5-10MB | 모든 페이지, 300 DPI, 품질 90 |
| PNG (ZIP) | 1-50MB | 1-20MB | 모든 페이지, 무손실 압축 9 |
| MP3 | 10-500MB | 0.5-5MB | 비트레이트 192kbps |
| WAV | 10-500MB | 10-50MB | 무손실, 높은 비트레이트 |
| MP4 | 100-2GB | 50-500MB | 품질 의존, 기본 2000kbps |
| GIF | 100-500MB | 2-10MB | 10fps, 최대 600x400 |

---

**Last Updated: 2024-11-06**
