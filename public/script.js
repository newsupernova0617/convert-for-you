// 🔹 Alpine.js Store 정의 (전역 상태 관리)
document.addEventListener('alpine:init', () => {
  Alpine.store('upload', {
    selectedFile: null,
    uploadedR2Path: null,           // R2에 업로드된 파일 경로
    isConverting: false,
    isCompleted: false,
    isDragover: false,
    convertedFileId: null,          // 변환된 파일 ID
    convertedFileName: '',
    errorMessage: '',

    // 파일 설정
    setFile(file) {
      if (validatePDF(file)) {
        this.selectedFile = file;
        this.errorMessage = '';
        logFileInfo(file);
        uploadFile(file, this); // 파일 업로드
      } else {
        this.errorMessage = 'PDF 파일만 업로드 가능합니다.';
        alert(this.errorMessage);
      }
    },

    // 변환 시작
    startConvert(format) {
      if (!this.uploadedR2Path) {
        this.errorMessage = '업로드된 파일이 없습니다.';
        return;
      }

      this.isConverting = true;
      this.errorMessage = '';
      convertFile(this.uploadedR2Path, format, this);
    },

    // 파일 다운로드
    download() {
      if (this.convertedFileId) {
        downloadFile(this.convertedFileId, this.convertedFileName);
      }
    },

    // 상태 초기화
    reset() {
      this.selectedFile = null;
      this.uploadedR2Path = null;
      this.isConverting = false;
      this.isCompleted = false;
      this.isDragover = false;
      this.convertedFileId = null;
      this.convertedFileName = '';
      this.errorMessage = '';
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  });
});

// 🔹 유틸 함수들

function validatePDF(file) {
  return file && file.type === 'application/pdf';
}

function logFileInfo(file) {
  console.log('📄 파일명:', file.name);
  console.log('📊 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');
}

// 파일 업로드 함수 (R2로 업로드)
async function uploadFile(file, store) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      store.uploadedR2Path = data.r2Path;  // R2 경로 저장
      store.errorMessage = '';
      console.log('✅ 파일 업로드 완료 (R2):', data.r2Path);
    } else {
      store.errorMessage = data.error || '파일 업로드 실패';
      console.error('❌ 업로드 오류:', data.error);
    }
  } catch (error) {
    store.errorMessage = '업로드 중 오류 발생: ' + error.message;
    console.error('❌ 업로드 오류:', error);
  }
}

// 파일 변환 함수 (R2 기반)
async function convertFile(r2Path, format, store) {
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        r2Path: r2Path,                    // R2 원본 파일 경로
        format: format,
        originalName: store.selectedFile.name
      })
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;      // 파일 ID 저장
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ 변환 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || '변환 실패';
      console.error('❌ 변환 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '변환 중 오류 발생: ' + error.message;
    console.error('❌ 변환 오류:', error);
  }
}

// 파일 다운로드 함수 (R2에서 다운로드)
async function downloadFile(fileId, fileName) {
  try {
    const response = await fetch(`/api/download/${fileId}`);

    if (!response.ok) {
      throw new Error('다운로드 실패');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ 파일 다운로드 완료:', fileName);
  } catch (error) {
    alert('다운로드 중 오류 발생: ' + error.message);
    console.error('❌ 다운로드 오류:', error);
  }
}

// 🔹 PDF 병합 관련 함수들

// 다중 파일 업로드 (PDF 병합용)
async function uploadMultipleFiles(files, store) {
  if (!files || files.length < 2) {
    store.errorMessage = '최소 2개 이상의 PDF 파일을 선택해주세요.';
    return;
  }

  if (files.length > 20) {
    store.errorMessage = '최대 20개까지만 선택 가능합니다.';
    return;
  }

  // 모든 파일이 PDF인지 확인
  for (let file of files) {
    if (!validatePDF(file)) {
      store.errorMessage = 'PDF 파일만 선택 가능합니다.';
      return;
    }
  }

  store.isConverting = true;
  store.errorMessage = '';

  const uploadedPaths = [];
  const fileNames = [];

  // 각 파일을 순차적으로 업로드
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    fileNames.push(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        uploadedPaths.push(data.r2Path);
        console.log(`✅ 파일 ${i + 1} 업로드 완료: ${file.name}`);
      } else {
        throw new Error(data.error || '파일 업로드 실패');
      }
    } catch (error) {
      store.isConverting = false;
      store.errorMessage = `파일 업로드 실패 (${file.name}): ${error.message}`;
      console.error('❌ 업로드 오류:', error);
      return;
    }
  }

  // 모든 파일 업로드 완료 후 병합 시작
  console.log(`✅ 모든 파일 업로드 완료 (${uploadedPaths.length}개)`);
  mergeFiles(uploadedPaths, fileNames, store);
}

// PDF 병합 함수
async function mergeFiles(r2Paths, fileNames, store) {
  try {
    const response = await fetch('/api/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        r2Paths: r2Paths,
        fileNames: fileNames
      })
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ PDF 병합 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || 'PDF 병합 실패';
      console.error('❌ 병합 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '병합 중 오류 발생: ' + error.message;
    console.error('❌ 병합 오류:', error);
  }
}

// 🔹 PDF 분할 관련 함수

// PDF 분할 함수
async function splitPdf(r2Path, ranges, store) {
  try {
    const response = await fetch('/api/split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        r2Path: r2Path,
        ranges: ranges
      })
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ PDF 분할 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || 'PDF 분할 실패';
      console.error('❌ 분할 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '분할 중 오류 발생: ' + error.message;
    console.error('❌ 분할 오류:', error);
  }
}

// 🔹 PDF 압축 관련 함수

// PDF 압축 함수
async function compressPdfFile(r2Path, quality, store) {
  try {
    const response = await fetch('/api/compress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        r2Path: r2Path,
        quality: quality
      })
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ PDF 압축 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || 'PDF 압축 실패';
      console.error('❌ 압축 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '압축 중 오류 발생: ' + error.message;
    console.error('❌ 압축 오류:', error);
  }
}

// 🔹 음성 변환 관련 함수

// 음성 변환 함수 (MP3/WAV/OGG/M4A/AAC)
async function convertAudioFile(r2Path, format, store, bitrate = 192) {
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        r2Path: r2Path,
        format: format,
        bitrate: parseInt(bitrate) || 192
      })
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ 음성 변환 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || '음성 변환 실패';
      console.error('❌ 음성 변환 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '음성 변환 중 오류 발생: ' + error.message;
    console.error('❌ 음성 변환 오류:', error);
  }
}

// 🔹 비디오 변환 관련 함수

// 비디오 변환 함수 (MP4/MOV/WebM/MKV)
async function convertVideoFile(r2Path, format, store, quality = 'medium') {
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        r2Path: r2Path,
        format: format,
        quality: quality || 'medium'
      })
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ 비디오 변환 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || '비디오 변환 실패';
      console.error('❌ 비디오 변환 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '비디오 변환 중 오류 발생: ' + error.message;
    console.error('❌ 비디오 변환 오류:', error);
  }
}

// 🔹 이미지 변환 관련 함수

// 이미지 변환 함수 (JPG/PNG/WEBP/HEIC)
async function convertImageFile(r2Path, format, store, additionalParam = null) {
  try {
    const body = {
      r2Path: r2Path,
      format: format
    };

    // 추가 파라미터 처리
    if (format === 'png-to-jpg') {
      body.backgroundColor = additionalParam || '#ffffff';
    } else if (['jpg-to-webp', 'png-to-webp', 'heic-to-jpg', 'heic-to-webp'].includes(format)) {
      body.quality = additionalParam || 80;
    } else if (['resize', 'compress-image'].includes(format)) {
      body.options = additionalParam;
    }

    const response = await fetch('/api/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.success) {
      store.isConverting = false;
      store.isCompleted = true;
      store.convertedFileId = data.fileId;
      store.convertedFileName = data.fileName;
      store.errorMessage = '';
      console.log('✅ 이미지 변환 완료:', data.fileName);
      console.log('📁 파일 ID:', data.fileId);
    } else {
      store.isConverting = false;
      store.errorMessage = data.error || '이미지 변환 실패';
      console.error('❌ 이미지 변환 오류:', data.error);
    }
  } catch (error) {
    store.isConverting = false;
    store.errorMessage = '이미지 변환 중 오류 발생: ' + error.message;
    console.error('❌ 이미지 변환 오류:', error);
  }
}

// 🔹 네비게이션 섹션 동적 생성

// 네비게이션 바 드롭다운 생성 함수
function enhanceNavbar() {
  const navbar = document.querySelector('nav.navbar');
  if (!navbar) return;

  // 이미 드롭다운이 있으면 제외
  if (navbar.querySelector('.dropdown-menu')) return;

  // 네비게이션 바의 container-fluid 찾기
  const navContainer = navbar.querySelector('.container-fluid');
  if (!navContainer) return;

  // 기존 brand 찾기
  const brand = navContainer.querySelector('.navbar-brand');

  // collapse div가 없으면 생성
  let collapseDiv = navContainer.querySelector('.collapse');
  if (!collapseDiv) {
    collapseDiv = document.createElement('div');
    collapseDiv.className = 'collapse navbar-collapse';
    collapseDiv.id = 'navbarNav';
    navContainer.appendChild(collapseDiv);
  }

  // navbar-nav 리스트가 없으면 생성
  let navList = collapseDiv.querySelector('.navbar-nav');
  if (!navList) {
    navList = document.createElement('ul');
    navList.className = 'navbar-nav ms-auto';
    collapseDiv.appendChild(navList);
  }

  // "변환 도구" 드롭다운 메뉴 생성
  const dropdownHtml = `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" href="#" id="converterDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        🔄 변환 도구
      </a>
      <ul class="dropdown-menu" aria-labelledby="converterDropdown">
        ${Object.entries(converterData).map(([category, converters]) => `
          <li><h6 class="dropdown-header">${category}</h6></li>
          ${converters.map(converter => `
            <li><a class="dropdown-item" href="${converter.href}">
              <span style="margin-right: 0.5rem;">${converter.icon}</span>${converter.title}
            </a></li>
          `).join('')}
          <li><hr class="dropdown-divider"></li>
        `).join('')}
      </ul>
    </li>
  `;

  navList.innerHTML = dropdownHtml + navList.innerHTML;

  // 토글 버튼이 없으면 추가
  if (!navContainer.querySelector('.navbar-toggler')) {
    const toggler = document.createElement('button');
    toggler.className = 'navbar-toggler';
    toggler.type = 'button';
    toggler.setAttribute('data-bs-toggle', 'collapse');
    toggler.setAttribute('data-bs-target', '#navbarNav');
    toggler.setAttribute('aria-controls', 'navbarNav');
    toggler.setAttribute('aria-expanded', 'false');
    toggler.setAttribute('aria-label', 'Toggle navigation');
    toggler.innerHTML = '<span class="navbar-toggler-icon"></span>';

    // brand 바로 뒤에 삽입
    if (brand) {
      brand.parentNode.insertBefore(toggler, brand.nextSibling);
    } else {
      navContainer.insertBefore(toggler, collapseDiv);
    }
  }
}

// 변환 도구 데이터
const converterData = {
  'PDF 변환': [
    { title: 'PDF to Word', icon: '📄', href: '/word.html' },
    { title: 'PDF to Excel', icon: '📊', href: '/excel.html' },
    { title: 'PDF to PowerPoint', icon: '🎯', href: '/ppt.html' },
    { title: 'PDF to JPG', icon: '🖼️', href: '/jpg.html' },
    { title: 'PDF to PNG', icon: '🎨', href: '/png.html' }
  ],
  '역방향 변환': [
    { title: 'Word to PDF', icon: '📝', href: '/word2pdf.html' },
    { title: 'Excel to PDF', icon: '📈', href: '/excel2pdf.html' },
    { title: 'PowerPoint to PDF', icon: '🎬', href: '/ppt2pdf.html' }
  ],
  'PDF 도구': [
    { title: 'PDF 병합', icon: '📎', href: '/merge-pdf.html' },
    { title: 'PDF 분할', icon: '✂️', href: '/split-pdf.html' },
    { title: 'PDF 압축', icon: '📦', href: '/compress-pdf.html' }
  ],
  '이미지 변환': [
    { title: 'PNG to JPG', icon: '🖼️', href: '/png-to-jpg.html' },
    { title: 'JPG to PNG', icon: '🎨', href: '/jpg-to-png.html' },
    { title: 'JPG to WebP', icon: '🌐', href: '/jpg-to-webp.html' },
    { title: 'PNG to WebP', icon: '🌐', href: '/png-to-webp.html' },
    { title: 'WebP to JPG', icon: '🖼️', href: '/webp-to-jpg.html' },
    { title: 'WebP to PNG', icon: '🎨', href: '/webp-to-png.html' },
    { title: 'HEIC to JPG', icon: '📱', href: '/heic-to-jpg.html' },
    { title: 'HEIC to PNG', icon: '📱', href: '/heic-to-png.html' },
    { title: '이미지 리사이징', icon: '📐', href: '/image-resize.html' }
  ],
  '오디오 변환': [
    { title: 'MP3 변환', icon: '🎵', href: '/mp3.html' },
    { title: 'WAV 변환', icon: '🔊', href: '/wav.html' },
    { title: 'OGG 변환', icon: '🎶', href: '/ogg.html' },
    { title: 'M4A 변환', icon: '🎼', href: '/m4a.html' },
    { title: 'AAC 변환', icon: '🎙️', href: '/aac.html' }
  ],
  '비디오 변환': [
    { title: 'MP4 변환', icon: '🎬', href: '/mp4.html' },
    { title: 'MOV 변환', icon: '🎥', href: '/mov.html' },
    { title: 'WebM 변환', icon: '🌐', href: '/webm.html' },
    { title: 'MKV 변환', icon: '📹', href: '/mkv.html' },
    { title: '비디오 압축', icon: '📦', href: '/video-compress.html' },
    { title: '비디오 GIF', icon: '🎞️', href: '/video-gif.html' }
  ]
};

// 네비게이션 섹션 렌더링 함수
function renderNavigationSection() {
  // index.html 페이지는 이미 섹션이 있으므로 제외
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    return;
  }

  const section = document.createElement('section');
  section.className = 'py-5 bg-light';

  let cardsHtml = '';
  for (const [category, converters] of Object.entries(converterData)) {
    for (const converter of converters) {
      cardsHtml += `
        <div class="col-md-6 col-lg-4">
          <a href="${converter.href}" class="text-decoration-none">
            <div class="text-center p-4 bg-white rounded-3 shadow-sm h-100 converter-card">
              <div style="font-size: 3rem; margin-bottom: 1rem;">${converter.icon}</div>
              <h3 class="h5">${converter.title}</h3>
              <p class="text-muted small">${category}</p>
            </div>
          </a>
        </div>
      `;
    }
  }

  section.innerHTML = `
    <div class="container">
      <h2 class="text-center mb-5">변환 도구 선택</h2>
      <div class="row g-4">
        ${cardsHtml}
      </div>
    </div>
  `;

  return section;
}

// 페이지 로드 시 네비게이션 섹션 및 navbar 드롭다운 추가
document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar 드롭다운 추가
  enhanceNavbar();

  // 2. 페이지 섹션에 네비게이션 섹션 추가
  const navSection = renderNavigationSection();
  if (navSection) {
    const footer = document.querySelector('footer');

    if (footer) {
      // footer 앞에 삽입
      footer.parentNode.insertBefore(navSection, footer);
    } else {
      // footer가 없으면 body의 끝에 추가
      document.body.appendChild(navSection);
    }
  }
});
