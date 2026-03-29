# FFprobe 경로 & Python 경로 문제 - 쉬운 설명

**작성일:** 2026-01-15

---

## 🔴 Issue #1: FFprobe 경로 문제

### 문제를 실제 예시로 보기

#### 현재 코드가 하는 일:
```javascript
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
```

#### 실제 상황 1: Windows에서

```javascript
// ffmpegPath의 실제 값
"C:\\Program Files\\nodejs\\node_modules\\@ffmpeg-installer\\ffmpeg\\ffmpeg.exe"

// replace('ffmpeg', 'ffprobe')를 하면?
// ❌ 첫 번째 'ffmpeg'만 바뀜!
"C:\\Program Files\\nodejs\\node_modules\\@ffprobe-installer\\ffmpeg\\ffmpeg.exe"
//                                          ^^^^^^^ 
//                                          폴더명이 바뀜!

// 우리가 원하는 것:
"C:\\Program Files\\nodejs\\node_modules\\@ffmpeg-installer\\ffmpeg\\ffprobe.exe"
//                                          ^^^^^^ 폴더명 유지  ^^^^^^^ 파일명만 변경
```

**결과:** 프로그램이 존재하지 않는 경로를 찾으려고 해서 에러 발생!

#### 실제 상황 2: 경로에 'ffmpeg'가 여러 번 나오는 경우

```javascript
// 만약 설치 경로가 이렇다면
"/home/user/ffmpeg-tools/bin/ffmpeg"

// replace('ffmpeg', 'ffprobe')를 하면?
// ❌ 첫 번째 'ffmpeg'만 바뀜!
"/home/user/ffprobe-tools/bin/ffmpeg"
//           ^^^^^^^ 폴더명이 바뀜, 파일명은 그대로!

// 우리가 원하는 것:
"/home/user/ffmpeg-tools/bin/ffprobe"
//           ^^^^^^ 폴더명 유지  ^^^^^^ 파일명만 변경
```

### 해결 방법

```javascript
// ✅ 올바른 방법: 정규식으로 파일명만 정확히 교체
const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');

// 설명:
// /ffmpeg(\.exe)?$/
//  ^^^^^^          'ffmpeg' 문자열을 찾되
//        ^^^^^^^^  .exe가 있을 수도, 없을 수도 (Windows는 .exe, Linux는 없음)
//                ^ $ 표시는 "문자열 끝"을 의미 → 파일명만 매칭!
```

### 테스트해보기

```javascript
// Windows
const path1 = "C:\\ffmpeg-installer\\ffmpeg\\ffmpeg.exe";
path1.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
// → "C:\\ffmpeg-installer\\ffmpeg\\ffprobe.exe" ✅

// Linux
const path2 = "/usr/local/bin/ffmpeg";
path2.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
// → "/usr/local/bin/ffprobe" ✅

// 폴더명에 ffmpeg 포함
const path3 = "/opt/ffmpeg-tools/ffmpeg.exe";
path3.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
// → "/opt/ffmpeg-tools/ffprobe.exe" ✅
//        ^^^^^^ 이 부분은 안 바뀜!
```

---

## 🟡 Issue #2: Python 경로 문제

### 문제를 실제 예시로 보기

#### 현재 코드:
```javascript
const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || 'python3';
```

### Windows에서 실제로 일어나는 일

#### 시나리오: Windows 사용자가 PDF를 Word로 변환하려고 함

```bash
# 1. 사용자가 변환 버튼 클릭
# 2. 서버가 Python 스크립트 실행 시도

# 서버 내부에서:
const PYTHON_BIN = 'python3';  // 환경변수 없으면 기본값
spawn('python3', ['pdf_to_docx.py', 'input.pdf', 'output.docx']);

# Windows 명령 프롬프트에서 실제로 실행되는 것:
C:\> python3 pdf_to_docx.py input.pdf output.docx

# ❌ 에러 발생!
'python3'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```

#### 왜 이런 일이 발생하나?

**Windows에서 Python 설치 시:**
```bash
# Python 설치 후 사용 가능한 명령어
C:\> python --version
Python 3.11.0  ✅

C:\> py --version
Python 3.11.0  ✅ (Python Launcher)

C:\> python3 --version
'python3'은(는) 내부 또는 외부 명령... 아닙니다.  ❌
```

**Linux/Mac에서 Python 설치 시:**
```bash
# Python 설치 후 사용 가능한 명령어
$ python --version
Python 2.7.18  (오래된 버전)

$ python3 --version
Python 3.11.0  ✅

$ py --version
command not found  ❌
```

### 왜 이런 차이가 있나?

#### Linux/Mac의 역사적 이유:
```
1. Python 2.x가 먼저 나옴 → 'python' 명령어 사용
2. Python 3.x가 나옴 → 'python3' 명령어로 구분
3. 이유: 기존 시스템이 Python 2에 의존하고 있어서
```

#### Windows의 경우:
```
1. Python 2.x를 기본 설치하지 않음
2. Python 3.x만 설치 → 'python' 명령어로 충분
3. 'python3' 명령어는 만들지 않음 (필요 없으니까)
```

### 실제 사용자 경험

#### ❌ 현재 코드 (문제 있음)

```
[Windows 사용자]
1. PDF 업로드 ✅
2. "Word로 변환" 클릭
3. 로딩... 로딩... 로딩...
4. ❌ 에러: "변환에 실패했습니다"

[서버 로그]
❌ PDF → Word 변환 실패: spawn python3 ENOENT
```

#### ✅ 수정 후 (정상 작동)

```
[Windows 사용자]
1. PDF 업로드 ✅
2. "Word로 변환" 클릭
3. 로딩...
4. ✅ 성공: "document.docx 다운로드"

[서버 로그]
✅ PDF → Word 변환 완료
```

### 해결 방법 3가지

#### 방법 1: 플랫폼 자동 감지 (권장)

```javascript
const os = require('os');

function getDefaultPythonBin() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return 'python';  // Windows → 'python'
  } else {
    return 'python3'; // Linux/Mac → 'python3'
  }
}

const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || getDefaultPythonBin();

// Windows에서: 'python' 사용 ✅
// Linux에서: 'python3' 사용 ✅
```

#### 방법 2: 환경 변수로 명시 (가장 안전)

```bash
# .env 파일에 추가

# Windows 사용자
PDF2DOCX_PYTHON_BIN=python

# Linux/Mac 사용자
PDF2DOCX_PYTHON_BIN=python3

# 가상환경 사용자
PDF2DOCX_PYTHON_BIN=/path/to/venv/bin/python
```

#### 방법 3: 자동으로 찾기

```javascript
function findPythonBin() {
  const { execSync } = require('child_process');
  const candidates = ['python3', 'python', 'py'];
  
  for (const cmd of candidates) {
    try {
      // 각 명령어가 실행되는지 테스트
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      console.log(`✅ Python 발견: ${cmd}`);
      return cmd;
    } catch (error) {
      // 이 명령어는 없음, 다음 시도
    }
  }
  
  throw new Error('Python을 찾을 수 없습니다');
}

const PYTHON_BIN = process.env.PDF2DOCX_PYTHON_BIN || findPythonBin();
```

---

## 📊 비교 요약

### FFprobe 경로 문제

| 항목 | 현재 (문제) | 수정 후 (해결) |
|------|------------|---------------|
| Windows | `@ffprobe-installer\ffmpeg\ffmpeg.exe` ❌ | `@ffmpeg-installer\ffmpeg\ffprobe.exe` ✅ |
| Linux | `/usr/ffprobe/bin/ffmpeg` ❌ | `/usr/ffmpeg/bin/ffprobe` ✅ |
| 결과 | 파일을 찾을 수 없음 | 정상 작동 |

### Python 경로 문제

| 환경 | 현재 (문제) | 수정 후 (해결) |
|------|------------|---------------|
| Windows | `python3` ❌ 명령어 없음 | `python` ✅ 작동 |
| Linux/Mac | `python3` ✅ 작동 | `python3` ✅ 작동 |
| 결과 | Windows에서 실패 | 모든 환경에서 작동 |

---

## 🎯 실제 영향

### FFprobe 경로 문제
```
영향받는 기능:
- 비디오 변환 (MP4, MOV, WebM, MKV)
- 오디오 변환 (MP3, WAV, OGG, M4A, AAC)
- 비디오 → GIF 변환
- 비디오/오디오 메타데이터 조회

증상:
- Windows에서 비디오/오디오 변환 실패
- 에러: "ffprobe를 찾을 수 없습니다"
```

### Python 경로 문제
```
영향받는 기능:
- PDF → Word 변환
- PDF → Excel 변환
- PDF → PowerPoint 변환

증상:
- Windows에서 PDF → Office 변환 실패
- 에러: "python3을 찾을 수 없습니다"
- Linux/Mac에서는 정상 작동
```

---

## 🔧 지금 수정해야 하나요?

### 긴급도 평가

#### FFprobe 경로: 🔴 **High Priority**
```
현재 상황:
- Windows 사용자는 비디오/오디오 변환 불가능
- 전체 기능의 ~30% 영향

권장:
- 즉시 수정 (10분 소요)
- 정규식 한 줄만 수정하면 됨
```

#### Python 경로: 🟡 **Medium Priority**
```
현재 상황:
- Windows 사용자는 PDF → Office 변환 불가능
- 전체 기능의 ~10% 영향
- 하지만 PDF → Office는 인기 기능!

권장:
- 빠른 시일 내 수정 (15분 소요)
- 플랫폼 감지 로직 추가
```

---

## ✅ 다음 단계

이해가 되셨나요? 

1. **FFprobe 경로 수정** - 정규식 한 줄만 바꾸면 됨
2. **Python 경로 수정** - 플랫폼 감지 로직 추가

바로 수정 작업을 진행할까요? 아니면 더 설명이 필요하신가요?
