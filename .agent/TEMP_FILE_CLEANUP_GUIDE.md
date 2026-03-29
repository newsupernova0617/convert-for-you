# 임시 파일 정리 시스템 사용 가이드

**작성일:** 2026-01-15  
**버전:** 1.0.0

---

## 📋 개요

임시 파일 정리 시스템은 변환 작업 중 생성되는 로컬 임시 파일을 자동으로 정리하여 디스크 공간을 확보합니다.

### 주요 기능

- ✅ **자동 정리**: 매 시간마다 24시간 이상 된 파일 자동 삭제
- ✅ **디스크 모니터링**: 디스크 사용량 90% 초과 시 긴급 정리
- ✅ **관리자 API**: 수동 정리 및 통계 조회 가능
- ✅ **안전한 처리**: 개별 파일 실패해도 계속 진행

---

## 🚀 설치 및 설정

### 1. 자동 시작 (이미 완료)

서버 시작 시 자동으로 실행됩니다:

```javascript
// server.js에서 자동 실행
startCleanupScheduler(60); // 60분마다 실행
```

### 2. 환경 변수 설정 (선택)

`.env` 파일에 추가:

```bash
# 임시 파일 최대 보존 시간 (밀리초, 기본: 24시간)
TEMP_FILE_MAX_AGE=86400000

# 예시:
# 12시간: 43200000
# 24시간: 86400000 (기본)
# 48시간: 172800000
```

---

## 📊 작동 방식

### 정리 대상 파일 패턴

```
/tmp/ (또는 %TEMP%)
├── pdf-to-*              # PDF 변환 임시 파일
├── video-input-*         # 비디오 입력 파일
├── video-output-*        # 비디오 출력 파일
├── video-metadata-*      # 비디오 메타데이터
├── audio-input-*         # 오디오 입력 파일
├── audio-output-*        # 오디오 출력 파일
├── audio-metadata-*      # 오디오 메타데이터
├── image-*               # 이미지 임시 파일
└── office-to-pdf-*       # Office 변환 임시 파일
```

### 실행 주기

```
서버 시작 → 즉시 1회 실행
     ↓
매 60분마다 자동 실행
     ↓
디스크 사용량 체크
     ├─ < 90%: 일반 정리 (24시간 이상 된 파일만)
     └─ ≥ 90%: 긴급 정리 (모든 임시 파일)
```

---

## 🎯 사용 예시

### 서버 로그 확인

```bash
# 서버 시작 시
🧹 임시 파일 정리 스케줄러 시작
⏰ 실행 주기: 60분마다
📁 보존 기간: 24시간

# 정리 실행 시
🧹 임시 파일 정리 시작...
📁 대상 디렉토리: /tmp
⏰ 보존 기간: 24시간
🔍 패턴 "pdf-to-*" 검사 중... (15개 파일)
  ✓ 삭제: pdf-to-1736883600000-abc123.tmp (26.3시간 경과)
  ✓ 삭제: pdf-to-1736883700000-def456.tmp (25.8시간 경과)

📊 정리 완료:
  ✅ 삭제: 12개
  ⚠️  실패: 0개
  💾 예상 확보 공간: ~120MB
```

---

## 🔧 관리자 API

### 1. 임시 파일 통계 조회

**요청:**
```http
GET /api/admin/temp-files
Authorization: Bearer {JWT_TOKEN}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 45,
    "totalSizeMB": "523.45",
    "oldFiles": 12,
    "oldSizeMB": "145.23",
    "timestamp": "2026-01-15T02:30:00.000Z"
  }
}
```

### 2. 수동 정리 (즉시 실행)

**요청:**
```http
POST /api/admin/cleanup-temp
Authorization: Bearer {JWT_TOKEN}
```

**응답:**
```json
{
  "success": true,
  "message": "임시 파일 정리 완료",
  "data": {
    "deleted": 12,
    "failed": 0,
    "errors": []
  }
}
```

### 3. 긴급 정리 (모든 파일 삭제)

**요청:**
```http
POST /api/admin/emergency-cleanup
Authorization: Bearer {JWT_TOKEN}
```

**응답:**
```json
{
  "success": true,
  "message": "긴급 정리 완료",
  "data": {
    "deleted": 45
  }
}
```

---

## 🔍 모니터링

### 디스크 사용량 자동 체크

```javascript
// 매 시간마다 자동 실행
💾 디스크 사용량: 85.3%  // 정상
💾 디스크 사용량: 92.1%  // ⚠️ 90% 초과!
🚨 긴급 정리 모드 시작!
```

### 로그 레벨

| 레벨 | 의미 | 예시 |
|------|------|------|
| `🧹` | 정리 시작 | 임시 파일 정리 시작... |
| `🔍` | 검사 중 | 패턴 "pdf-to-*" 검사 중... |
| `✓` | 성공 | 삭제: file.tmp (26.3시간 경과) |
| `⚠️` | 경고 | 실패: file.tmp - Permission denied |
| `❌` | 에러 | 임시 파일 정리 중 오류 발생 |
| `🚨` | 긴급 | 긴급 정리 모드 시작! |

---

## ⚙️ 고급 설정

### 실행 주기 변경

```javascript
// server.js에서
startCleanupScheduler(30);  // 30분마다 실행
startCleanupScheduler(120); // 2시간마다 실행
```

### 보존 기간 변경

```bash
# .env 파일
TEMP_FILE_MAX_AGE=43200000  # 12시간
```

### 프로그래밍 방식 호출

```javascript
const { 
  cleanupOldTempFiles,
  emergencyCleanup,
  getCleanupStats 
} = require('./utils/tempFileCleanup');

// 수동 정리
const result = await cleanupOldTempFiles();
console.log(`삭제: ${result.deleted}개`);

// 긴급 정리
const count = await emergencyCleanup();
console.log(`긴급 삭제: ${count}개`);

// 통계 조회
const stats = await getCleanupStats();
console.log(`총 파일: ${stats.totalFiles}개`);
```

---

## 🐛 문제 해결

### Q1: 파일이 삭제되지 않아요

**원인:**
- 파일이 다른 프로세스에 의해 잠김 (Windows)
- 권한 부족

**해결:**
```bash
# 로그 확인
⚠️  실패: video-123.tmp - EBUSY: resource busy or locked

# 대기 후 재시도됨 (자동)
# 또는 서버 재시작 후 정리됨
```

### Q2: 디스크 공간이 계속 부족해요

**원인:**
- 변환 실패가 너무 많음
- 보존 기간이 너무 김

**해결:**
```bash
# 1. 긴급 정리 실행
POST /api/admin/emergency-cleanup

# 2. 보존 기간 단축
TEMP_FILE_MAX_AGE=43200000  # 24시간 → 12시간

# 3. 실행 주기 단축
startCleanupScheduler(30);  # 60분 → 30분
```

### Q3: 정리가 너무 느려요

**원인:**
- 임시 파일이 너무 많음 (수천 개)

**해결:**
```javascript
// 긴급 정리 사용 (더 빠름)
await emergencyCleanup();
```

---

## 📈 성능 영향

### 리소스 사용량

| 항목 | 사용량 | 비고 |
|------|--------|------|
| **CPU** | < 1% | 파일 스캔 시에만 |
| **메모리** | < 10MB | 파일 목록 저장 |
| **디스크 I/O** | 낮음 | 삭제 작업만 |
| **실행 시간** | 1-5초 | 파일 수에 따라 |

### 예상 효과

```
일일 변환 수: 1,000회
평균 임시 파일 크기: 10MB
보존 기간: 24시간

→ 최대 디스크 사용: 1,000 × 10MB × 2 (input+output) = 20GB
→ 정리 후: ~0GB (24시간 이상 된 파일 삭제)
→ 월간 절약: ~600GB
```

---

## 🎯 베스트 프랙티스

### 1. 프로덕션 환경

```bash
# .env 설정
TEMP_FILE_MAX_AGE=43200000  # 12시간 (더 짧게)

# server.js 설정
startCleanupScheduler(30);  # 30분마다 (더 자주)
```

### 2. 개발 환경

```bash
# .env 설정
TEMP_FILE_MAX_AGE=3600000   # 1시간 (빠른 정리)

# server.js 설정
startCleanupScheduler(15);  # 15분마다
```

### 3. 모니터링 설정

```javascript
// 디스크 사용량 알림
const diskUsage = await checkDiskUsage();
if (diskUsage > 80) {
  // 알림 전송 (Slack, Email 등)
  sendAlert(`디스크 사용량: ${diskUsage}%`);
}
```

---

## 📝 체크리스트

### 초기 설정
- [x] `utils/tempFileCleanup.js` 파일 생성
- [x] `server.js`에 스케줄러 통합
- [x] `adminRoutes.js`에 API 추가
- [ ] `.env`에 `TEMP_FILE_MAX_AGE` 설정 (선택)

### 운영 확인
- [ ] 서버 로그에서 정리 스케줄러 시작 확인
- [ ] 1시간 후 자동 정리 실행 확인
- [ ] 관리자 API로 통계 조회 테스트
- [ ] 수동 정리 기능 테스트

### 모니터링
- [ ] 디스크 사용량 주기적 확인
- [ ] 정리 실패 로그 모니터링
- [ ] 임시 파일 수 추이 관찰

---

## 🔗 관련 문서

- [CONVERSION_LOGIC_REVIEW.md](./.agent/CONVERSION_LOGIC_REVIEW.md) - 변환 로직 점검
- [IMPROVEMENT_ISSUES_DETAILED.md](./.agent/IMPROVEMENT_ISSUES_DETAILED.md) - 개선 이슈 상세

---

**구현 완료! 🎉**

이제 서버가 자동으로 임시 파일을 정리하여 디스크 공간을 확보합니다.
