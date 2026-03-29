# 개발 환경 설정 가이드

## 변경 사항 요약

이제 **환경변수 없이도 로컬 개발이 가능**합니다! 🎉

### 주요 변경사항

1. **환경변수 검증 완화**
   - 프로덕션 환경에서만 필수 환경변수를 강제합니다
   - 개발 모드에서는 기본값을 사용하여 경고만 표시합니다

2. **기본값 설정**
   - `JWT_SECRET`: `'dev-secret-key-change-in-production'`
   - `ADMIN_PASSWORD`: `'admin123'`
   - R2 설정: 더미 값 사용 (R2 기능은 비활성화됨)

3. **R2 스토리지 처리**
   - R2가 설정되지 않은 경우 graceful하게 처리
   - 업로드/다운로드/삭제 작업 시 경고 메시지 표시
   - 로컬 파일 시스템을 대신 사용 가능

## 로컬 개발 시작하기

### 1. 환경변수 없이 실행 (가장 간단)

```bash
npm run dev
```

또는

```bash
node server.js
```

서버가 `http://localhost:3002`에서 실행됩니다.

### 2. 환경변수 파일 사용 (권장)

프로덕션과 유사한 환경에서 테스트하려면:

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 실제 값 입력
# (선택사항 - 기본값으로도 작동합니다)
```

## 서버 확인

### Health Check
브라우저에서 다음 URL을 열어 서버 상태 확인:
```
http://localhost:3002/health
```

예상 응답:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2026-01-25T03:58:15.000Z"
}
```

### 테스트 페이지
`test-server.html` 파일을 브라우저에서 열어 서버 연결 테스트

## 관리자 페이지 로그인

개발 모드 기본 비밀번호:
- **비밀번호**: `admin123`

⚠️ **프로덕션 배포 전 반드시 변경하세요!**

## 프로덕션 배포

Railway 또는 다른 프로덕션 환경에 배포할 때는 반드시 다음 환경변수를 설정하세요:

### 필수 환경변수

```bash
# 인증
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
ADMIN_PASSWORD=your-strong-admin-password

# Cloudflare R2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
```

### 선택적 환경변수

```bash
PORT=3002
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
MAX_FILE_SIZE=52428800
```

## 개발 모드 vs 프로덕션 모드

| 기능 | 개발 모드 | 프로덕션 모드 |
|------|----------|--------------|
| 환경변수 검증 | 경고만 표시 | 필수 (없으면 종료) |
| JWT_SECRET | 기본값 사용 | 반드시 설정 필요 |
| ADMIN_PASSWORD | `admin123` | 반드시 설정 필요 |
| R2 스토리지 | 비활성화 (로컬 파일 사용) | 반드시 설정 필요 |
| HTTPS 강제 | 비활성화 | 활성화 |

## 문제 해결

### 서버가 시작되지 않는 경우

1. 포트 3002가 이미 사용 중인지 확인:
   ```bash
   netstat -ano | findstr :3002
   ```

2. Node.js 버전 확인 (14.x 이상 권장):
   ```bash
   node --version
   ```

3. 의존성 재설치:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### R2 관련 경고가 표시되는 경우

개발 모드에서는 정상입니다. R2 기능이 필요하지 않다면 무시해도 됩니다.

필요한 경우 `.env` 파일에 R2 환경변수를 추가하세요.

## 다음 단계

1. ✅ 로컬에서 서버 실행 확인
2. ✅ Health check 엔드포인트 테스트
3. 📝 기능 개발 및 테스트
4. 🚀 프로덕션 배포 전 환경변수 설정
5. 🔒 보안 설정 강화 (JWT_SECRET, ADMIN_PASSWORD)

## 참고 파일

- `.env.example`: 환경변수 예시 파일
- `test-server.html`: 서버 테스트 페이지
- `server.js`: 메인 서버 파일
- `config/auth.js`: 인증 설정
- `config/r2.js`: R2 스토리지 설정
