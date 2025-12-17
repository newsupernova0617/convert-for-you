import os
import re
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(r"C:\Users\yj437\OneDrive\Desktop\coding_windows\convert-for-you\public")

# 한국어 -> 영어 매핑
TRANSLATIONS = {
    # Hero Section
    "무료 파일 변환 도구": "Free File Converter",
    "PDF, 이미지, 오디오, 비디오 등 다양한 형식으로 빠르게 변환하세요": "Convert PDF, images, audio, and video quickly and securely",
    
    # PDF Conversion Tools
    "PDF to Word 변환": "PDF to Word Converter",
    "PDF 파일을 Word (.docx)로 빠르게 변환하세요": "Convert PDF to Word quickly",
    "PDF to Excel 변환": "PDF to Excel Converter",
    "PDF 파일을 Excel (.xlsx)로 빠르게 변환하세요": "Convert PDF to Excel quickly",
    "PDF to PowerPoint 변환": "PDF to PowerPoint Converter",
    "PDF 파일을 PowerPoint (.pptx)로 빠르게 변환하세요": "Convert PDF to PowerPoint quickly",
    "PDF to JPG 변환": "PDF to JPG Converter",
    "PDF 파일을 JPG 이미지로 빠르게 변환하세요": "Convert PDF to JPG images quickly",
    "PDF to PNG 변환": "PDF to PNG Converter",
    "PDF 파일을 PNG 이미지로 빠르게 변환하세요": "Convert PDF to PNG images quickly",
    
    # Image Conversion
    "HEIC to JPG 변환": "HEIC to JPG Converter",
    "HEIC 파일을 JPG으로 빠르게 변환하세요": "Convert HEIC to JPG quickly",
    "HEIC to PNG 변환": "HEIC to PNG Converter",
    "HEIC 파일을 PNG으로 빠르게 변환하세요": "Convert HEIC to PNG quickly",
    
    # Buttons & Actions
    "파일을 선택하세요": "Select a file",
    "PDF 파일을 드래그하거나 클릭하여 선택": "Drag and drop or click to select PDF file",
    "파일 선택": "Select File",
    "파일이 준비되었습니다": "File is ready",
    "변환 시작": "Convert",
    "다른 파일": "Another File",
    "변환 중입니다": "Converting",
    "잠깐만 기다려주세요...": "Please wait...",
    "변환이 완료되었습니다! 🎉": "Conversion Complete! 🎉",
    "파일을 다운로드하여 사용하세요": "Download your file",
    "다운로드": "Download",
    "새로운 파일 변환하기": "Convert Another File",
    "다시 선택": "Select Again",
    
    # File Info
    "파일 크기": "File Size",
    "형식": "Format",
    "대상 형식": "Target Format",
    
    # Status Messages
    "를 Word로 변환 중": " converting to Word",
    
    # Tab Navigation
    "변환 도구 선택": "Choose Conversion Tool",
    "PDF 변환": "PDF Conversion",
    "PDF 관리": "PDF Management",
    "Office → PDF": "Office → PDF",
    "이미지 변환": "Image Conversion",
    "오디오 & 비디오": "Audio & Video",
    
    # Converter Cards
    "편집 가능한 Word 문서로": "Convert to editable Word",
    "스프레드시트로 변환": "Convert to spreadsheet",
    "프레젠테이션으로 변환": "Convert to presentation",
    "JPG 이미지로 변환": "Convert to JPG images",
    "PNG 이미지로 변환": "Convert to PNG images",
    "PDF 파일 크기 줄이기": "Reduce PDF file size",
    "PDF를 여러 파일로 분할": "Split PDF into files",
    "여러 PDF를 하나로 병합": "Merge multiple PDFs",
    "Word 문서를 PDF로": "Convert Word to PDF",
    "Excel 파일을 PDF로": "Convert Excel to PDF",
    "PPT 파일을 PDF로": "Convert PowerPoint to PDF",
    "Apple 형식을 JPG로": "Convert Apple format to JPG",
    "Apple 형식을 PNG로": "Convert Apple format to PNG",
    "JPG를 PNG로 변환": "Convert JPG to PNG",
    "PNG를 JPG로 변환": "Convert PNG to JPG",
    "최신 형식으로 최적화": "Optimize to modern format",
    "WebP를 JPG로 변환": "Convert WebP to JPG",
    "WebP를 PNG로 변환": "Convert WebP to PNG",
    "이미지 크기 조정": "Resize images",
    "오디오를 MP3로": "Convert to MP3",
    "오디오를 WAV로": "Convert to WAV",
    "오디오를 OGG로": "Convert to OGG",
    "오디오를 M4A로": "Convert to M4A",
    "오디오를 AAC로": "Convert to AAC",
    "비디오를 MP4로": "Convert to MP4",
    "비디오를 MOV로": "Convert to MOV",
    "비디오를 WebM로": "Convert to WebM",
    "비디오를 MKV로": "Convert to MKV",
    "비디오 파일 크기 줄이기": "Reduce video file size",
    "비디오를 GIF로 변환": "Convert video to GIF",
    
    # Features Section
    "주요 기능": "Key Features",
    "빠른 변환": "Fast Conversion",
    "몇 초 내에 PDF를 변환합니다": "Convert files in seconds",
    "안전한 변환": "Secure Conversion",
    "256비트 SSL 암호화로 보호합니다": "Protected with 256-bit SSL encryption",
    "256비트 SSL 암호화로 보호": "Protected with SSL encryption",
    "모든 장치 지원": "All Devices Supported",
    "PC, 태블릿, 스마트폰 모두 지원합니다": "Works on PC, tablet, and smartphone",
    "PC, 태블릿, 스마트폰": "PC, tablet, smartphone",
    "쉬운 다운로드": "Easy Download",
    "변환 완료 후 바로 다운로드 가능합니다": "Download immediately after conversion",
    "고품질 결과": "High Quality Results",
    "형식 유지하며 완벽 변환": "Perfect conversion maintaining format",
    
    # Info Section
    "무료 PDF 변환": "Free PDF Conversion",
    "PDF to Word 변환에 대해": "About PDF to Word Conversion",
    "HEIC to JPG 변환에 대해": "About HEIC to JPG Conversion",
    "PDF to Word 변환 도구는 PDF 파일을 쉽게 편집 가능한 Word 문서로 변환합니다.": "PDF to Word converter easily transforms PDF files into editable Word documents.",
    "텍스트, 이미지, 서식을 유지하면서 완벽하게 변환됩니다.": "Perfectly converts while maintaining text, images, and formatting.",
    "HEIC to JPG 변환 도구는 PDF 파일을 쉽게 편집 가능한 Word 문서로 변환합니다.": "HEIC to JPG converter easily transforms iPhone photos to JPG format.",
    "PDF Converter는 PDF 파일을 다양한 형식으로 쉽게 변환하는 온라인 도구입니다.": "Convert4U is an online tool that easily converts files to various formats.",
    "회원가입 없이 무제한으로 이용할 수 있습니다.": "Use unlimited without registration.",
    
    "왜 우리를 선택하나요?": "Why Choose Us?",
    "무료이고 제한이 없습니다": "Free and unlimited",
    "등록이 필요하지 않습니다": "No registration required",
    "높은 품질의 변환 결과": "High quality results",
    "빠른 처리 속도": "Fast processing",
    "24시간 이용 가능합니다": "Available 24/7",
    
    # Footer
    "무료 온라인 PDF 변환 도구로 다양한 형식으로 변환하세요.": "Free online file converter for various formats.",
    "무료 온라인 파일 변환 도구로 PDF, 이미지, 오디오, 비디오 등을 변환하세요.": "Free online file converter for PDF, images, audio, and video.",
    "변환 도구": "Conversion Tools",
    "정보": "Information",
    "개인정보 보호정책": "Privacy Policy",
    "이용약관": "Terms of Service",
    "문의하기": "Contact Us",
    "지원": "Support",
    "자주 묻는 질문": "FAQ",
    "사용 가이드": "User Guide",
    "기능 요청": "Feature Request",
    "모든 권리 보유.": "All rights reserved.",
    
    # Ads
    "광고": "Advertisement",
    
    # PDF Management
    "PDF 압축": "Compress PDF",
    "PDF 분할": "Split PDF",
    "PDF 병합": "Merge PDF",
    
    # Image Tools
    "이미지 리사이즈": "Image Resize",
    
    # Video Tools
    "비디오 압축": "Video Compress",
    "비디오 to GIF": "Video to GIF",
    
    # Audio Names (maintaining English but translating descriptions)
    "MP3 변환": "MP3 Converter",
    "WAV 변환": "WAV Converter",
    "OGG 변환": "OGG Converter",
    "M4A 변환": "M4A Converter",
    "AAC 변환": "AAC Converter",
    "MP4 변환": "MP4 Converter",
    "MOV 변환": "MOV Converter",
    "WebM 변환": "WebM Converter",
    "MKV 변환": "MKV Converter",
}

def translate_html_file(filepath):
    """HTML 파일의 한국어 텍스트를 영어로 변환"""
    filename = os.path.basename(filepath)
    
    # Skip Google verification file
    if filename.startswith('google'):
        print(f"⏭️  Skipping {filename} (Google verification file)")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 각 번역 적용
        for korean, english in TRANSLATIONS.items():
            content = content.replace(korean, english)
        
        # 변경사항이 없으면 건너뛰기
        if content == original_content:
            print(f"⏭️  Skipping {filename} (no Korean text found)")
            return False
        
        # 파일 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Translated {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error translating {filename}: {str(e)}")
        return False

def main():
    """모든 HTML 파일 처리"""
    print("🌍 Translating all HTML files to English...\n")
    
    translated_count = 0
    skipped_count = 0
    
    # public 폴더의 모든 HTML 파일 처리
    for html_file in sorted(BASE_DIR.glob("*.html")):
        if translate_html_file(html_file):
            translated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Translated: {translated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"\n🌍 English translation complete!")

if __name__ == "__main__":
    main()
