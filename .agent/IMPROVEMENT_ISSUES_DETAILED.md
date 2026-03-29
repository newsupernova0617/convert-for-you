# 변환 로직 개선 이슈 상세 설명

**작성일:** 2026-01-15

---

## 🟡 Issue #1: FFprobe 경로 처리 문제

### 문제 상황

**현재 코드 (`convertAudio.js`, `convertVideo.js`):**
```javascript
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffmpeg-installer/ffmpeg').path.replace('ffmpeg', 'ffprobe');
```

### 왜 문제인가?

#### 시나리오 1: Windows 환경
```javascript
// ffmpegPath 예시
"C:\\Users\\user\\node_modules\\@ffmpeg-installer\\ffmpeg\\ffmpeg.exe"

// 현재 방식으로 replace
"C:\\Users\\user\\node_modules\\@ffmpeg-installer\\ffmpeg\\ffprobe.exe"
//                                              ^^^^^^^ 
// 문제: 'ffmpeg' 폴더명도 'ffprobe'로 바뀜!

// 실제 결과
"C:\\Users\\user\\node_modules\\@ffprobe-installer\\ffprobe\\ffprobe.exe"
// ❌ 잘못된 경로!
```

#### 시나리오 2: 파일명에 'ffmpeg'가 여러 번 포함된 경우
```javascript
// 만약 경로가 이렇다면
"/opt/ffmpeg-tools/bin/ffmpeg"

// 현재 방식
"/opt/ffprobe-tools/bin/ffprobe"
// ❌ 첫 번째 'ffmpeg'만 바뀜, 폴더명도 바뀜!
```

### 올바른 해결 방법

```javascript
// ✅ 권장 방식: 정규식으로 파일명만 정확히 교체
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');

// 설명:
// /ffmpeg(\.exe)?$/
//  ^^^^^^          - 'ffmpeg' 문자열
//        ^^^^^^^^  - .exe가 있을 수도 있고 없을 수도 (Windows vs Linux)
//                ^ - 문자열 끝에서만 매칭 (폴더명은 안 바뀜)
// 
// 'ffprobe$1'
//          ^^ - $1은 (\.exe)? 그룹을 참조 (있으면 .exe, 없으면 빈 문자열)
```

### 테스트 케이스

```javascript
// Windows
"/path/to/ffmpeg.exe" → "/path/to/ffprobe.exe" ✅

// Linux/Mac
"/usr/bin/ffmpeg" → "/usr/bin/ffprobe" ✅

// 폴더명에 ffmpeg 포함
"/opt/ffmpeg-tools/bin/ffmpeg.exe" → "/opt/ffmpeg-tools/bin/ffprobe.exe" ✅
//     ^^^^^^ 이 부분은 안 바뀜!

// 중간에 ffmpeg 포함
"/home/ffmpeg-user/ffmpeg" → "/home/ffmpeg-user/ffprobe" ✅
//           ^^^^^^ 이 부분은 안 바뀜!
```

### 수정 필요 파일

1. `utils/converters/convertAudio.js` (Line 17)
2. `utils/converters/convertVideo.js` (Line 18)

---

## 🟡 Issue #2: Python 바이너리 경로 문제

### 문제 상황

**현재 코드 (`convertPdfToWord.js`):**
```javascript
const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || 'python3';
```

### 왜 문제인가?

#### Windows vs Linux/Mac 차이

| 환경 | 기본 Python 명령어 | 현재 코드 동작 |
|------|-------------------|---------------|
| **Windows** | `python` 또는 `py` | ❌ `python3` 실행 실패 |
| **Linux/Mac** | `python3` | ✅ 정상 동작 |

#### Windows에서 발생하는 에러

```bash
# Windows 명령 프롬프트에서
C:\> python3 script.py
'python3'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.

# 올바른 명령어
C:\> python script.py  # ✅
C:\> py script.py      # ✅ (Python Launcher)
```

### 왜 이런 차이가 있나?

1. **Linux/Mac**
   - `python` → Python 2.x (레거시)
   - `python3` → Python 3.x (권장)
   - 명확한 구분을 위해 `python3` 사용

2. **Windows**
   - Python 2.x가 기본 설치 안 됨
   - `python` → Python 3.x
   - `py` → Python Launcher (여러 버전 관리)
   - `python3` 명령어 없음 (심볼릭 링크 수동 설정 필요)

### 올바른 해결 방법

#### 방법 1: 플랫폼 감지 (권장)

```javascript
const os = require('os');

// 플랫폼에 따라 기본값 설정
const getDefaultPythonBin = () => {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return 'python';  // Windows
  } else {
    return 'python3'; // Linux/Mac
  }
};

const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || getDefaultPythonBin();
```

#### 방법 2: 환경 변수 필수화 (더 안전)

```javascript
const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN;

if (!PYTHON_BIN) {
  throw new Error(
    'PDF2DOCX_PYTHON_BIN 환경 변수를 설정하세요.\n' +
    'Windows: python 또는 py\n' +
    'Linux/Mac: python3'
  );
}
```

#### 방법 3: Python 실행 파일 자동 탐색

```javascript
const { execSync } = require('child_process');

const findPythonBin = () => {
  const candidates = ['python3', 'python', 'py'];
  
  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd; // 첫 번째로 찾은 것 사용
    } catch (error) {
      // 이 명령어는 없음, 다음 시도
    }
  }
  
  throw new Error('Python을 찾을 수 없습니다. Python 3를 설치하세요.');
};

const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || findPythonBin();
```

### 권장 사항

**`.env` 파일에 명시적으로 설정:**

```bash
# Windows
PDF2DOCX_PYTHON_BIN=python

# Linux/Mac
PDF2DOCX_PYTHON_BIN=python3

# 특정 버전 사용 (가상환경 등)
PDF2DOCX_PYTHON_BIN=/path/to/venv/bin/python
```

### 수정 필요 파일

1. `utils/converters/convertPdfToWord.js` (Line 14)
2. `utils/converters/convertPdfToExcel.js` (유사한 패턴)
3. `utils/converters/convertPdfToPpt.js` (유사한 패턴)

---

## 🟡 Issue #3: 임시 파일 정리 실패 처리

### 문제 상황

**현재 코드 패턴 (모든 변환기에서 동일):**
```javascript
try {
  // 변환 작업
  const result = await readFile(outputPath);
  return result;
} catch (error) {
  throw error;
} finally {
  // 임시 파일 정리
  try {
    if (fs.existsSync(inputPath)) await unlink(inputPath);
    if (fs.existsSync(outputPath)) await unlink(outputPath);
    console.log('🧹 임시 파일 정리 완료');
  } catch (err) {
    console.warn('⚠️ 임시 파일 정리 중 오류:', err.message);
    // ❌ 경고만 출력하고 끝! 실제로는 파일이 남아있음
  }
}
```

### 왜 문제인가?

#### 시나리오 1: 디스크 공간 부족

```javascript
// 1시간 동안 100개 변환 실패
// 각 파일 평균 10MB라면...
100 files × 10MB × 2 (input + output) = 2GB 디스크 낭비!

// 계속 쌓이면...
// → 디스크 풀
// → 새로운 변환 실패
// → 서비스 중단
```

#### 시나리오 2: 권한 문제

```javascript
// Windows에서 파일이 다른 프로세스에 의해 잠김
Error: EBUSY: resource busy or locked, unlink 'C:\temp\video-123.tmp'

// 현재 코드: 경고만 출력
console.warn('⚠️ 임시 파일 정리 중 오류:', err.message);

// 결과: 파일이 계속 쌓임
```

#### 시나리오 3: 임시 폴더 확인

```bash
# Linux/Mac
$ ls /tmp/pdf-to-* | wc -l
1,247 files  # 😱 정리 안 된 파일들

# Windows
C:\> dir %TEMP%\video-* /s
523 files found  # 😱
```

### 왜 이런 일이 발생하나?

1. **파일 잠금 (File Locking)**
   - Windows에서 특히 빈번
   - 바이러스 백신이 스캔 중
   - 다른 프로세스가 파일 사용 중

2. **권한 문제**
   - 파일 생성 시와 삭제 시 권한 다름
   - 특히 Docker 컨테이너에서

3. **타이밍 이슈**
   - 파일이 아직 완전히 닫히지 않음
   - 비동기 작업 완료 전 삭제 시도

### 올바른 해결 방법

#### 방법 1: 재시도 로직 추가

```javascript
async function unlinkWithRetry(filePath, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
        return true;
      }
      return true; // 파일이 이미 없음
    } catch (error) {
      if (i === maxRetries - 1) {
        // 마지막 시도 실패
        throw error;
      }
      // 잠시 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 사용
finally {
  try {
    await unlinkWithRetry(inputPath);
    await unlinkWithRetry(outputPath);
    console.log('🧹 임시 파일 정리 완료');
  } catch (err) {
    // 재시도해도 실패하면 로그에 기록
    console.error('❌ 임시 파일 정리 실패:', err.message);
    console.error('파일 경로:', inputPath, outputPath);
    // 모니터링 시스템에 알림 전송 (선택)
  }
}
```

#### 방법 2: 주기적인 정리 스크립트 (Cron Job)

```javascript
// utils/cleanupTempFiles.js
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function cleanupOldTempFiles() {
  const tmpDir = os.tmpdir();
  const patterns = [
    'pdf-to-*',
    'video-input-*',
    'video-output-*',
    'audio-input-*',
    'audio-output-*'
  ];
  
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24시간
  
  for (const pattern of patterns) {
    try {
      const files = await fs.readdir(tmpDir);
      const matchingFiles = files.filter(f => 
        f.startsWith(pattern.replace('*', ''))
      );
      
      for (const file of matchingFiles) {
        const filePath = path.join(tmpDir, file);
        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;
          
          if (age > maxAge) {
            await fs.unlink(filePath);
            console.log(`🗑️ 오래된 임시 파일 삭제: ${file}`);
          }
        } catch (err) {
          // 개별 파일 처리 실패는 무시하고 계속
          console.warn(`⚠️ ${file} 처리 실패:`, err.message);
        }
      }
    } catch (err) {
      console.error(`❌ ${pattern} 패턴 정리 실패:`, err.message);
    }
  }
}

// 매 시간마다 실행
setInterval(cleanupOldTempFiles, 60 * 60 * 1000);

module.exports = { cleanupOldTempFiles };
```

#### 방법 3: 전용 임시 디렉토리 사용

```javascript
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// 앱 전용 임시 디렉토리 생성
const APP_TEMP_DIR = path.join(os.tmpdir(), 'convert4u-temp');

async function ensureTempDir() {
  try {
    await fs.mkdir(APP_TEMP_DIR, { recursive: true });
  } catch (err) {
    // 이미 존재하면 무시
  }
}

// 서버 시작 시 호출
ensureTempDir();

// 서버 종료 시 전체 디렉토리 삭제
async function cleanupOnShutdown() {
  try {
    await fs.rm(APP_TEMP_DIR, { recursive: true, force: true });
    console.log('🧹 임시 디렉토리 정리 완료');
  } catch (err) {
    console.error('❌ 임시 디렉토리 정리 실패:', err.message);
  }
}

process.on('SIGTERM', cleanupOnShutdown);
process.on('SIGINT', cleanupOnShutdown);
```

### 권장 조합 솔루션

```javascript
// 1. 즉시 정리 (재시도 포함)
finally {
  await unlinkWithRetry(inputPath);
  await unlinkWithRetry(outputPath);
}

// 2. 주기적 정리 (백업)
// server.js에서
const { cleanupOldTempFiles } = require('./utils/cleanupTempFiles');
setInterval(cleanupOldTempFiles, 60 * 60 * 1000); // 매 시간

// 3. 모니터링
// 디스크 사용량 체크
const diskUsage = await checkDiskUsage();
if (diskUsage > 90) {
  console.error('⚠️ 디스크 사용량 90% 초과!');
  await cleanupOldTempFiles(); // 즉시 정리
}
```

### 수정 필요 파일

**모든 변환기 파일:**
1. `utils/converters/convertPdfToWord.js`
2. `utils/converters/convertPdfToExcel.js`
3. `utils/converters/convertPdfToPpt.js`
4. `utils/converters/convertOfficeToPdf.js`
5. `utils/converters/convertAudio.js`
6. `utils/converters/convertVideo.js`
7. `utils/converters/convertVideoToGif.js`

**새로 추가:**
- `utils/cleanupTempFiles.js` (주기적 정리)
- `server.js`에 정리 스케줄러 추가

---

## 📊 우선순위 및 영향도

| 이슈 | 우선순위 | 영향도 | 수정 난이도 | 예상 시간 |
|------|---------|--------|------------|----------|
| **FFprobe 경로** | 🔴 High | Medium | Easy | 10분 |
| **Python 경로** | 🟡 Medium | High | Easy | 15분 |
| **임시 파일 정리** | 🟡 Medium | High | Medium | 1시간 |

### 권장 수정 순서

1. **FFprobe 경로** (즉시)
   - 간단한 정규식 수정
   - 크로스 플랫폼 호환성 확보

2. **Python 경로** (즉시)
   - 플랫폼 감지 로직 추가
   - `.env` 문서화

3. **임시 파일 정리** (중기)
   - 재시도 로직 추가
   - 주기적 정리 스크립트 구현
   - 모니터링 추가

---

## 🎯 예상 효과

### FFprobe 경로 수정 후
- ✅ Windows 환경에서 비디오/오디오 변환 안정화
- ✅ 다양한 설치 경로 지원

### Python 경로 수정 후
- ✅ Windows 사용자도 PDF 변환 가능
- ✅ 배포 환경 유연성 증가

### 임시 파일 정리 개선 후
- ✅ 디스크 공간 절약 (월 수십 GB)
- ✅ 장기 운영 안정성 확보
- ✅ 서비스 중단 위험 감소

---

**다음 단계: 각 이슈별 수정 코드를 작성하시겠습니까?**
