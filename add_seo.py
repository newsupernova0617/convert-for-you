import os
import re
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(r"C:\Users\yj437\OneDrive\Desktop\coding_windows\convert-for-you\public")

# 각 페이지에 맞는 SEO 메타데이터 정의
SEO_DATA = {
    # PDF Conversion Tools
    "word.html": {
        "title": "PDF to Word Converter - Free Online Tool | Convert4U",
        "description": "Convert PDF to Word online for free. Transform PDF files to editable DOCX format quickly and easily. No registration required, unlimited conversions.",
        "keywords": "PDF to Word, PDF converter, PDF to DOCX, free PDF converter, edit PDF, PDF to Word online"
    },
    "excel.html": {
        "title": "PDF to Excel Converter - Free Online Tool | Convert4U",
        "description": "Convert PDF to Excel online for free. Extract tables and data from PDF to XLS/XLSX spreadsheets. Fast and accurate conversion.",
        "keywords": "PDF to Excel, PDF to XLS, PDF to XLSX, PDF table converter, PDF data extraction, free Excel converter"
    },
    " ppt.html": {
        "title": "PDF to PowerPoint Converter - Free Online Tool | Convert4U",
        "description": "Convert PDF to PowerPoint online for free. Transform PDF files to editable PPT/PPTX presentations quickly.",
        "keywords": "PDF to PowerPoint, PDF to PPT, PDF to PPTX, PDF presentation converter, free PowerPoint converter"
    },
    "jpg.html": {
        "title": "PDF to JPG Converter - Free Online Tool | Convert4U",
        "description": "Convert PDF to JPG images online for free. Extract all pages from PDF as high-quality JPG files. No registration required.",
        "keywords": "PDF to JPG, PDF to image, PDF to JPEG, PDF image extraction, free image converter"
    },
    "png.html": {
        "title": "PDF to PNG Converter - Free Online Tool | Convert4U",
        "description": "Convert PDF to PNG images online for free. Extract pages from PDF to PNG format with transparency support.",
        "keywords": "PDF to PNG, PDF to image, PNG converter, PDF extraction, free PNG converter"
    },
    
    # PDF Management
    "compress-pdf.html": {
        "title": "Compress PDF - Reduce PDF File Size Online | Convert4U",
        "description": "Compress PDF files online for free. Reduce PDF file size while maintaining quality. Fast and easy compression.",
        "keywords": "compress PDF, reduce PDF size, PDF compression, shrink PDF, optimize PDF, free PDF compressor"
    },
    "split-pdf.html": {
        "title": "Split PDF - Divide PDF into Multiple Files | Convert4U",
        "description": "Split PDF files online for free. Divide large PDF documents into separate files by page ranges.",
        "keywords": "split PDF, divide PDF, separate PDF pages, PDF splitter, extract PDF pages"
    },
    "merge-pdf.html": {
        "title": "Merge PDF - Combine PDF Files Online | Convert4U",
        "description": "Merge multiple PDF files into one online for free. Combine PDF documents quickly and easily.",
        "keywords": "merge PDF, combine PDF, join PDF, PDF merger, unite PDF files, concatenate PDF"
    },
    
    # Office to PDF
    "word2pdf.html": {
        "title": "Word to PDF Converter - Free Online Tool | Convert4U",
        "description": "Convert Word to PDF online for free. Transform DOCX/DOC files to PDF format with perfect formatting.",
        "keywords": "Word to PDF, DOCX to PDF, DOC to PDF, Word converter, free PDF creator"
    },
    "excel2pdf.html": {
        "title": "Excel to PDF Converter - Free Online Tool | Convert4U",
        "description": "Convert Excel to PDF online for free. Transform XLS/XLSX spreadsheets to PDF with high quality.",
        "keywords": "Excel to PDF, XLS to  PDF, XLSX to PDF, spreadsheet to PDF, Excel converter"
    },
    "ppt2pdf.html": {
        "title": "PowerPoint to PDF Converter - Free Online Tool | Convert4U",
        "description": "Convert PowerPoint to PDF online for free. Transform PPT/PPTX presentations to PDF format.",
        "keywords": "PowerPoint to PDF, PPT to PDF, PPTX to PDF, presentation to PDF, PowerPoint converter"
    },
    
    # Image Conversion
    "heic-to-jpg.html": {
        "title": "HEIC to JPG Converter - Free Online Tool | Convert4U",
        "description": "Convert HEIC to JPG online for free. Transform iPhone/iPad photos to JPG format quickly and easily. No registration required, unlimited conversions.",
        "keywords": "HEIC to JPG, HEIC converter, iPhone photo converter, Apple image conversion, free image converter, HEIC to JPEG"
    },
    "heic-to-png.html": {
        "title": "HEIC to PNG Converter - Free Online Tool | Convert4U",
        "description": "Convert HEIC to PNG online for free. Transform iPhone/iPad photos to PNG format with transparency support.",
        "keywords": "HEIC to PNG, HEIC converter, iPhone image converter, Apple photo conversion, HEIC to PNG online"
    },
    "jpg-to-png.html": {
        "title": "JPG to PNG Converter - Free Online Tool | Convert4U",
        "description": "Convert JPG to PNG online for free. Transform JPEG images to PNG format with transparency support.",
        "keywords": "JPG to PNG, JPEG to PNG, image converter, JPG converter, free PNG converter"
    },
    "png-to-jpg.html": {
        "title": "PNG to JPG Converter - Free Online Tool | Convert4U",
        "description": "Convert PNG to JPG online for free. Transform PNG images to JPEG format for smaller file sizes.",
        "keywords": "PNG to JPG, PNG to JPEG, image converter, PNG converter, compress PNG"
    },
    "jpg-to-webp.html": {
        "title": "JPG to WebP Converter - Free Online Tool | Convert4U",
        "description": "Convert JPG to WebP online for free. Transform JPEG images to modern WebP format for better compression.",
        "keywords": "JPG to WebP, JPEG to WebP, image optimization, WebP converter, reduce image size"
    },
    "png-to-webp.html": {
        "title": "PNG to WebP Converter - Free Online Tool | Convert4U",
        "description": "Convert PNG to WebP online for free. Optimize images with modern WebP format for faster loading.",
        "keywords": "PNG to WebP, image optimization, WebP converter, compress PNG, reduce file size"
    },
    "webp-to-jpg.html": {
        "title": "WebP to JPG Converter - Free Online Tool | Convert4U",
        "description": "Convert WebP to JPG online for free. Transform WebP images to widely supported JPEG format.",
        "keywords": "WebP to JPG, WebP to JPEG, WebP converter, image converter"
    },
    "webp-to-png.html": {
        "title": "WebP to PNG Converter - Free Online Tool | Convert4U",
        "description": "Convert WebP to PNG online for free. Transform WebP images to PNG format with transparency.",
        "keywords": "WebP to PNG, WebP converter, image converter, PNG converter"
    },
    "image-resize.html": {
        "title": "Image Resizer - Resize Images Online Free | Convert4U",
        "description": "Resize images online for free. Change image dimensions and optimize file size. Supports JPG, PNG, WebP formats.",
        "keywords": "resize image, image resizer, reduce image size, scale image, optimize image"
    },
    
    # Audio Conversion
    "mp3.html": {
        "title": "MP3 Converter - Convert Audio to MP3 Online | Convert4U",
        "description": "Convert audio files to MP3 online for free. Support for WAV, OGG, M4A, AAC and more. High quality conversion.",
        "keywords": "MP3 converter, audio converter, convert to MP3, audio to MP3, free MP3 converter"
    },
    "wav.html": {
        "title": "WAV Converter - Convert Audio to WAV Online | Convert4U",
        "description": "Convert audio files to WAV online for free. High quality lossless audio conversion.",
        "keywords": "WAV converter, audio converter, convert to WAV, MP3 to WAV, audio to WAV"
    },
    "ogg.html": {
        "title": "OGG Converter - Convert Audio to OGG Online | Convert4U",
        "description": "Convert audio files to OGG Vorbis format online for free. Open-source audio compression.",
        "keywords": "OGG converter, audio converter, convert to OGG, OGG Vorbis, free audio converter"
    },
    "m4a.html": {
        "title": "M4A Converter - Convert Audio to M4A Online | Convert4U",
        "description": "Convert audio files to M4A format online for free. High quality AAC audio compression.",
        "keywords": "M4A converter, audio converter, convert to M4A, AAC converter, free M4A converter"
    },
    "aac.html": {
        "title": "AAC Converter - Convert Audio to AAC Online | Convert4U",
        "description": "Convert audio files to AAC format online for free. Advanced audio coding with high efficiency.",
        "keywords": "AAC converter, audio converter, convert to AAC, audio compression, free AAC converter"
    },
    
    # Video Conversion
    "mp4.html": {
        "title": "MP4 Converter - Convert Video to MP4 Online | Convert4U",
        "description": "Convert videos to MP4 format online for free. Universal video format compatible with all devices.",
        "keywords": "MP4 converter, video converter, convert to MP4, video to MP4, free MP4 converter"
    },
    "mov.html": {
        "title": "MOV Converter - Convert Video to MOV Online | Convert4U",
        "description": "Convert videos to MOV format online for free. QuickTime movie format for Mac and iOS.",
        "keywords": "MOV converter, video converter, convert to MOV, QuickTime converter, video to MOV"
    },
    "webm.html": {
        "title": "WebM Converter - Convert Video to WebM Online | Convert4U",
        "description": "Convert videos to WebM format online for free. Modern web video format with efficient compression.",
        "keywords": "WebM converter, video converter, convert to WebM, web video, free WebM converter"
    },
    "mkv.html": {
        "title": "MKV Converter - Convert Video to MKV Online | Convert4U",
        "description": "Convert videos to MKV format online for free. Matroska container for high quality video.",
        "keywords": "MKV converter, video converter, convert to MKV, Matroska, free MKV converter"
    },
    "video-compress.html": {
        "title": "Compress Video - Reduce Video File Size Online | Convert4U",
        "description": "Compress video files online for free. Reduce file size while maintaining quality. Fast video compression.",
        "keywords": "compress video, reduce video size, video compression, shrink video, optimize video"
    },
    "video-gif.html": {
        "title": "Video to GIF Converter - Create GIF from Video | Convert4U",
        "description": "Convert video to GIF online for free. Create animated GIFs from video files quickly and easily.",
        "keywords": "video to GIF, GIF maker, create GIF, video converter, animated GIF"
    },
    
    # Information Pages
    "faq.html": {
        "title": "FAQ - Frequently Asked Questions | Convert4U",
        "description": "Find answers to common questions about Convert4U file conversion service. Learn about supported formats, privacy, and features.",
        "keywords": "FAQ, help, questions, support, file conversion help"
    },
    "user-guide.html": {
        "title": "User Guide - How to Use Convert4U | Convert4U",
        "description": "Learn how to use Convert4U to convert files online. Step-by-step guide for all conversion tools.",
        "keywords": "user guide, tutorial, how to use, help, instructions"
    },
    "contact.html": {
        "title": "Contact Us - Get in Touch | Convert4U",
        "description": "Contact Convert4U for support, feedback, or business inquiries. We're here to help.",
        "keywords": "contact, support, feedback, help, inquiries"
    },
    "feature-request.html": {
        "title": "Feature Request - Suggest New Features | Convert4U",
        "description": "Suggest new features or improvements for Convert4U. We value your feedback.",
        "keywords": "feature request, suggestions, feedback, improvements"
    },
    "privacy-policy.html": {
        "title": "Privacy Policy - Your Data Protection | Convert4U",
        "description": "Read our privacy policy to understand how we protect your data and respect your privacy.",
        "keywords": "privacy policy, data protection, privacy, security"
    },
    "terms-of-service.html": {
        "title": "Terms of Service - Usage Agreement | Convert4U",
        "description": "Read the terms of service for using Convert4U file conversion service.",
        "keywords": "terms of service, terms, agreement, legal"
    }
}

def create_seo_head(filename):
    """각 파일에 맞는 SEO head 태그 생성"""
    if filename not in SEO_DATA:
        return None
    
    data = SEO_DATA[filename]
    page_url = f"https://convert4u.keero.site/{filename}"
    
    return f'''<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="{data['description']}">
  <meta name="keywords" content="{data['keywords']}">
  <meta name="author" content="Convert4U">
  <meta name="robots" content="index, follow">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="{page_url}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Convert4U">
  <meta property="og:title" content="{data['title']}">
  <meta property="og:description" content="{data['description']}">
  <meta property="og:url" content="{page_url}">
  <meta property="og:image" content="https://convert4u.keero.site/og-image.png">
  <meta property="og:locale" content="ko_KR">
  
  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{data['title']}">
  <meta name="twitter:description" content="{data['description']}">
  <meta name="twitter:image" content="https://convert4u.keero.site/og-image.png">
  
  <title>{data['title']}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>'''

def update_html_file(filepath):
    """HTML 파일의 head 섹션을 SEO 최적화된 버전으로 교체"""
    filename = os.path.basename(filepath)
    
    # SEO 데이터가 없는 파일은 건너뛰기
    if filename not in SEO_DATA:
        print(f"⏭️  Skipping {filename} (no SEO data)")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 기존 head 태그 패턴 찾기
        head_pattern = r'<head>.*?</head>'
        
        # 새로운 SEO head 생성
        new_head = create_seo_head(filename)
        
        if not new_head:
            return False
        
        # head 교체
        updated_content = re.sub(head_pattern, new_head, content, flags=re.DOTALL)
        
        # "PDF Converter" 브랜드명을 "Convert4U"로 교체 (navbar에서)
        updated_content = updated_content.replace(
            '<a class="navbar-brand fw-bold text-primary" href="/">PDF Converter</a>',
            '<a class="navbar-brand fw-bold text-primary" href="/">Convert4U</a>'
        )
        
        # 파일 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Updated {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {filename}: {str(e)}")
        return False

def main():
    """모든 HTML 파일 처리"""
    print("🚀 Starting SEO optimization...\n")
    
    updated_count = 0
    skipped_count = 0
    
    # public 폴더의 모든 HTML 파일 처리
    for html_file in BASE_DIR.glob("*.html"):
        if update_html_file(html_file):
            updated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Updated: {updated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"\n🎉 SEO optimization complete!")

if __name__ == "__main__":
    main()
