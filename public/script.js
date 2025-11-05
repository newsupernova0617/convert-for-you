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
