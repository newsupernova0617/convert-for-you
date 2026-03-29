# 프로젝트 개요 보고서: Convert4U

**작성일:** 2026-01-15
**프로젝트명:** Convert4U (미디어 변환 플랫폼)

## 1. 요약

Convert4U는 PDF, Office 문서, 이미지, 오디오, 비디오 등 28개 이상의 파일 형식을 변환하는 풀스택 웹 애플리케이션입니다. 회원가입 없이 드래그앤드롭으로 간편하게 사용할 수 있습니다. 백엔드는 Node.js/Express 기반으로, 무거운 처리 작업을 위한 워커 스레드와 Cloudflare R2 저장소를 활용하여 성능과 확장성을 갖추고 있습니다.

## 2. 기술 스택

### 백엔드
- **런타임:** Node.js
- **프레임워크:** Express.js (^4.18.2)
- **데이터베이스:** SQLite (better-sqlite3), 높은 동시성을 위한 WAL 모드 사용
- **저장소:** Cloudflare R2 (S3 호환), 임시 파일 저장용
- **처리 도구:**
    - `piscina`: CPU 집약적 작업(PDF/이미지 변환)을 위한 워커 스레드 풀
    - `fluent-ffmpeg`: 오디오/비디오 변환
    - `libreoffice` (CLI): Office 문서 변환
    - `sharp`: 이미지 처리

### 프론트엔드
- **아키텍처:** Express가 서빙하는 정적 HTML 페이지
- **프레임워크:**
    - **Bootstrap 5:** 반응형 UI 및 스타일링
    - **Alpine.js:** 경량 반응형 상태 관리 (드래그앤드롭, 진행 바)
- **핵심 파일:** `public/index.html` (랜딩), `public/script.js` (핵심 로직)

### DevOps 및 자동화
- **Python 스크립트:** 정적 HTML 파일 일괄 업데이트용 (SEO 삽입, 번역, CSS 삽입)
- **테스팅:** Jest를 사용한 단위 및 통합 테스트
- **보안:** Helmet (CSP, HSTS), Rate Limiting, CORS
- **배포:** Railway 등의 환경에 맞게 구성, Docker 사용 (CLAUDE.md에서 언급), 우아한 종료(graceful shutdown) 지원

## 3. 아키텍처 및 핵심 워크플로우

### 디렉토리 구조
- `server.js`: 애플리케이션 진입점. 미들웨어, 보안, 라우트 설정
- `routes/`: 관심사별로 분리된 API 엔드포인트 (`upload`, `convert`, `download`, `admin`)
- `utils/`:
    - `converterPool.js`: 메인 스레드 블로킹 방지를 위한 워커 스레드 관리
    - `scheduler.js`: 2분마다 실행되어 만료된 파일 정리 (10분 보존)
    - `converters/`: 각 형식군별 변환 로직
- `public/`: 89개 이상의 HTML 페이지 포함, Python 스크립트로 일관성 유지

### 데이터 흐름
1. **업로드:** 사용자 파일 업로드 → 검증 (매직 넘버) → R2 `uploads/`에 저장
2. **변환:** 요청 전송 → 워커가 R2에서 다운로드 → 변환 (Piscina/FFmpeg) → R2 `converted/`에 결과 업로드
3. **다운로드:** 사용자 파일 요청 → 서버가 R2에서 스트리밍
4. **정리:** 10분 후 파일 만료 (설정 가능), 스케줄러가 삭제

## 4. 핵심 기능 및 특징

- **고성능:** `better-sqlite3`와 `piscina`를 사용하여 동시성과 CPU 부하를 효과적으로 처리
- **보안 우선:** 파일 매직 넘버를 통한 엄격한 입력 검증, 강력한 CSP(Content Security Policy), 남용 방지를 위한 Rate Limiting 구현
- **관리자 시스템:** JWT로 보호되는 관리자 대시보드로 통계, 저장소 사용량, 시스템 상태 모니터링
- **다국어 지원:** 원래 한국어 또는 한국 사용자를 대상으로 개발된 것으로 보이나 (`translate_to_english.py` 및 `CLAUDE.md` 내용으로 추정), 현재는 영어로 완전히 현지화됨
- **SEO 최적화:** 맞춤 Python 스크립트로 모든 정적 HTML 페이지에 SEO 메타데이터 (Title, Description, Keywords) 삽입

## 5. 결론

Convert4U는 잘 구조화된 프로덕션 레디 애플리케이션입니다. 프론트엔드 빌드 체인의 복잡성을 피하면서도 (React/Vue 복잡한 빌드 없음) 강력한 백엔드 패턴 (워커 풀, 클라우드 저장소)을 활용하여 리소스 집약적인 작업을 안정적으로 처리합니다. 정적 사이트 유지 관리에 Python을 사용하는 것은 유사한 HTML 파일 다수를 관리하기 위한 실용적인 선택입니다.
