# Docker로 경로 문제 해결 가능 여부 분석

**작성일:** 2026-01-15

---

## 🎯 결론부터 말하면

| 문제 | Docker로 해결? | 이유 |
|------|---------------|------|
| **FFprobe 경로** | ✅ **해결됨** | Linux 컨테이너 사용 시 일관된 경로 |
| **Python 경로** | ✅ **해결됨** | Linux 컨테이너에서는 `python3` 사용 |
| **임시 파일 정리** | ⚠️ **부분 해결** | 여전히 필요하지만 더 예측 가능 |

**하지만:** Docker를 사용해도 **코드 수정이 더 나은 선택**입니다!

---

## 📦 Docker 사용 시 변화

### 1. FFprobe 경로 문제

#### ❌ 현재 (Windows 로컬 실행)
```javascript
// Windows에서 실행 시
const ffmpegPath = "C:\\node_modules\\@ffmpeg-installer\\ffmpeg\\ffmpeg.exe";
const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
// → "C:\\node_modules\\@ffprobe-installer\\ffmpeg\\ffmpeg.exe" ❌
```

#### ✅ Docker 컨테이너 (Linux)
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg

# 컨테이너 내부 경로 (일관됨)
# /usr/bin/ffmpeg
# /usr/bin/ffprobe
```

```javascript
// Linux 컨테이너에서 실행 시
const ffmpegPath = "/usr/bin/ffmpeg";
const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
// → "/usr/bin/ffprobe" ✅ 작동!
```

**결과:** Docker 사용 시 FFprobe 경로 문제 **해결됨** ✅

---

### 2. Python 경로 문제

#### ❌ 현재 (Windows 로컬 실행)
```javascript
const PYTHON_BIN = 'python3';
// Windows: 'python3' 명령어 없음 ❌
```

#### ✅ Docker 컨테이너 (Linux)
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip
RUN pip3 install pdf2docx
```

```javascript
// Linux 컨테이너에서 실행 시
const PYTHON_BIN = 'python3';
// Linux: 'python3' 명령어 있음 ✅
```

**결과:** Docker 사용 시 Python 경로 문제 **해결됨** ✅

---

### 3. 임시 파일 정리 문제

#### Docker 사용 시에도 여전히 필요

```dockerfile
# 컨테이너 내부에서도 임시 파일 생성됨
/tmp/
├── pdf-to-1234567890.tmp
├── video-input-1234567891.tmp
└── audio-output-1234567892.tmp
```

**차이점:**
- ✅ 파일 권한 문제 적음 (Linux)
- ✅ 파일 잠금 문제 적음 (Windows 특유 문제 없음)
- ⚠️ 여전히 디스크 공간 관리 필요
- ⚠️ 컨테이너 재시작 시 자동 정리되지만, 실행 중에는 쌓임

**결과:** Docker 사용 시에도 정리 스케줄러 **여전히 권장** ⚠️

---

## 🤔 그럼 Docker를 써야 할까?

### Docker의 장점

#### ✅ 환경 일관성
```
개발 환경 (Windows) ≠ 프로덕션 (Linux)  ❌

Docker 사용 시:
개발 환경 (Docker) = 프로덕션 (Docker)  ✅
```

#### ✅ 의존성 관리
```dockerfile
# 모든 의존성을 Dockerfile에 명시
FROM node:18-alpine

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    libreoffice

RUN pip3 install pdf2docx

# → 어디서든 동일하게 작동!
```

#### ✅ 배포 간편화
```bash
# 로컬에서 테스트
docker build -t convert4u .
docker run -p 3002:3002 convert4u

# 프로덕션 배포
docker push convert4u:latest
# → Railway, AWS, GCP 어디든 동일하게 작동
```

---

### Docker의 단점

#### ❌ 개발 복잡도 증가
```bash
# 코드 수정할 때마다
1. 코드 수정
2. Docker 이미지 재빌드 (시간 소요)
3. 컨테이너 재시작
4. 테스트

# vs 로컬 개발
1. 코드 수정
2. nodemon 자동 재시작
3. 테스트
```

#### ❌ 리소스 사용량 증가
```
로컬 실행: Node.js 프로세스만
Docker 실행: Docker 데몬 + 컨테이너 + Node.js 프로세스
→ 메모리 추가 사용 (~500MB)
```

#### ❌ Windows에서 성능 저하
```
Windows → Docker Desktop → Linux VM → 컨테이너
→ 파일 I/O 성능 저하 (특히 비디오 변환)
```

---

## 💡 최선의 해결책

### 권장: **코드 수정 + Docker 선택적 사용**

#### 1단계: 코드 수정 (필수)
```javascript
// ✅ 크로스 플랫폼 지원
const os = require('os');

// FFprobe 경로
const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');

// Python 경로
const defaultPython = os.platform() === 'win32' ? 'python' : 'python3';
const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || defaultPython;
```

**장점:**
- ✅ Windows, Linux, Mac 모두 작동
- ✅ Docker 없이도 작동
- ✅ Docker 사용 시에도 작동
- ✅ 개발 환경 유연성

#### 2단계: Docker 사용 (선택)
```dockerfile
# Dockerfile (프로덕션용)
FROM node:18-alpine

# 의존성 설치
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    libreoffice

# Python 패키지
RUN pip3 install pdf2docx

# 앱 복사
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3002
CMD ["npm", "start"]
```

**사용 시나리오:**
- ✅ 프로덕션 배포 (Railway, AWS, GCP)
- ✅ CI/CD 파이프라인
- ✅ 팀 협업 (환경 통일)

---

## 📊 시나리오별 비교

### 시나리오 1: 로컬 개발 (Windows)

| 방법 | 작동 여부 | 개발 편의성 | 성능 |
|------|----------|-----------|------|
| **현재 코드** | ❌ 일부 실패 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **코드 수정** | ✅ 모두 작동 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Docker만** | ✅ 모두 작동 | ⭐⭐⭐ | ⭐⭐⭐ |
| **코드 수정 + Docker** | ✅ 모두 작동 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**권장:** 코드 수정 (10분 투자로 모든 문제 해결)

---

### 시나리오 2: 프로덕션 배포 (Linux 서버)

| 방법 | 작동 여부 | 배포 편의성 | 유지보수 |
|------|----------|-----------|---------|
| **현재 코드** | ⚠️ FFprobe 문제 가능 | ⭐⭐⭐ | ⭐⭐ |
| **코드 수정** | ✅ 모두 작동 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Docker만** | ✅ 모두 작동 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **코드 수정 + Docker** | ✅ 모두 작동 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**권장:** 코드 수정 + Docker (최고의 조합)

---

## 🎯 실전 가이드

### 상황 1: "지금 당장 Windows에서 개발하고 싶어요"

```bash
# 1. 코드 수정 (10분)
# - FFprobe 경로 정규식 수정
# - Python 경로 플랫폼 감지 추가

# 2. 로컬에서 바로 실행
npm run dev

# ✅ 모든 기능 작동!
```

---

### 상황 2: "프로덕션 배포 준비 중이에요"

```bash
# 1. 코드 수정 (10분) - 기본 호환성 확보

# 2. Dockerfile 작성
# 3. Docker 이미지 빌드
docker build -t convert4u .

# 4. 로컬 테스트
docker run -p 3002:3002 convert4u

# 5. 배포
docker push convert4u:latest

# ✅ 어디서든 동일하게 작동!
```

---

### 상황 3: "팀 협업 중이에요 (Windows + Mac 혼용)"

```bash
# 1. 코드 수정 (필수) - 모든 OS 지원

# 2. Docker Compose 작성 (선택)
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3002:3002"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development

# 3. 팀원들은 선택
# - Windows: Docker 사용
# - Mac: 로컬 실행 또는 Docker

# ✅ 모두 동일한 환경!
```

---

## 🏆 최종 권장 사항

### 1순위: **코드 수정** (필수)
```
시간: 10-15분
효과: 모든 환경에서 작동
비용: 무료
복잡도: 낮음
```

### 2순위: **Docker 추가** (선택)
```
시간: 30분-1시간
효과: 배포 간편화, 환경 통일
비용: 무료 (리소스 약간 증가)
복잡도: 중간
```

---

## 📝 체크리스트

### 즉시 해야 할 것
- [ ] FFprobe 경로 정규식 수정 (10분)
- [ ] Python 경로 플랫폼 감지 추가 (10분)
- [ ] 임시 파일 정리 스케줄러 확인 (이미 완료 ✅)

### 나중에 고려할 것
- [ ] Dockerfile 작성 (프로덕션 배포 시)
- [ ] docker-compose.yml 작성 (팀 협업 시)
- [ ] CI/CD 파이프라인 구축

---

## 💬 결론

**Docker로 해결될까?** → ✅ 네, 해결됩니다!

**하지만 코드 수정이 더 나은 이유:**
1. ✅ 10분이면 끝 (Docker는 1시간)
2. ✅ 모든 환경 지원 (Docker 없이도)
3. ✅ 개발 편의성 유지
4. ✅ 성능 저하 없음
5. ✅ Docker 사용 시에도 작동

**최선의 선택:**
```
1단계: 코드 수정 (지금 바로)
2단계: Docker 추가 (프로덕션 배포 시)
```

---

**다음 단계:** 코드 수정을 진행할까요? 아니면 Docker 설정부터 할까요?
