"""
한글 인코딩 문제 수정 - 간단 버전
깨진 한글을 직접 찾아서 영어로 교체
"""
from pathlib import Path

# 파일별 교체 매핑 (단순 문자열 교체)
SIMPLE_REPLACEMENTS = {
    # Hero sections
    '?렦 MP3 Converter': '🎵 MP3 Converter',
    '?뚯꽦 ?뚯씪??MP3 Format?쇰줈 蹂?섑븯?몄슂': 'Convert audio files to MP3 format',
    
    '?렒 WAV Converter': '🎵 WAV Converter',
    '?뚯꽦 ?뚯씪??WAV Format?쇰줈 蹂?섑븯?몄슂': 'Convert audio files to WAV format',
    
    '?렯 OGG Converter': '🎵 OGG Converter',
    '?뚯꽦 ?뚯씪??OGG Format?쇰줈 蹂?섑븯?몄슂': 'Convert audio files to OGG format',
    
    '?렦 M4A Converter': '🎵 M4A Converter',
    '?뚯꽦 ?뚯씪??M4A Format?쇰줈 蹂?섑븯?몄슂': 'Convert audio files to M4A format',
    
    '?렒 AAC Converter': '🎵 AAC Converter',
    '?뚯꽦 ?뚯씪??AAC Format?쇰줈 蹂?섑븯?몄슂': 'Convert audio files to AAC format',
    
    '?렗 MP4 Converter': '🎬 MP4 Converter',
    '鍮꾨뵒?? ?뚯씪??MP4 Format?쇰줈 蹂?섑븯?몄슂': 'Convert video files to MP4 format',
    
    '?렏 MOV Converter': '🎬 MOV Converter',
    '鍮꾨뵒?? ?뚯씪??MOV Format?쇰줈 蹂?섑븯?몄슂': 'Convert video files to MOV format',
    
    '?벞 WebM Converter': '🎬 WebM Converter',
    '鍮꾨뵒?? ?뚯씪??WebM Format?쇰줈 蹂?섑븯?몄슂': 'Convert video files to WebM format',
    
    '?렗 MKV Converter': '🎬 MKV Converter',
    '鍮꾨뵒?? ?뚯씪??MKV Format?쇰줈 蹂?섑븯?몄슂': 'Convert video files to MKV format',
    
    '?뿙截??Video Compress': '🗜️ Video Compress',
    '鍮꾨뵒?? ?뚯씪 ?⑹씠利? 以꾩씠湲?': 'Reduce video file size',
    
    '?렄截??Video to GIF': '🎞️ Video to GIF',
    '鍮꾨뵒?? ?뚯씪??GIF濡?蹂??': 'Convert video to GIF',
    
    # Common UI text
    '?ъ슜?? ?뚯씪???뚯뼱?볤굅???대┃?섏뿬 ?낅줈??': 'Drag and drop your file here or click to browse',
    'Select Again': 'Select Again',
    'Another File 蹂??': 'Convert Another File',
    '?뱿 ?뚯씪 Download': 'Download File',
    '??蹂??以?..': 'Converting...',
    '蹂???꾨즺!': 'Conversion Complete!',
    '?ㅻ쪟:': 'Error:',
    '?좏깮???뚯씪:': 'Selected File:',
    
    # Bitrate options
    '鍮꾪듃?덉씠??(kbps):': 'Bitrate (kbps):',
    '128 kbps (??? ?덉쭏)': '128 kbps (Low Quality)',
    '192 kbps (?쒖?)': '192 kbps (Recommended)',
    '256 kbps (?믪? ?덉쭏)': '256 kbps (High Quality)',
    '320 kbps (理쒓퀬 ?덉쭏)': '320 kbps (Best Quality)',
    
    # Buttons
    '?렦 MP3濡?蹂??': '🎵 Convert to MP3',
    'WAV濡?蹂??': 'Convert to WAV',
    'OGG濡?蹂??': 'Convert to OGG',
    
    # Features
    '??Fast Conversion': '⚡ Fast Conversion',
    '怨좎냽 FFmpeg ?붿쭊?쇰줈 鍮좊Ⅴ寃?蹂?섑빀?덈떎': 'Fast conversion with FFmpeg engine',
    '?럻截???덉쭏 議곗젅': '🎚️ Quality Control',
    '鍮꾪듃?덉씠?몃? ?좏깮?섏뿬 ?덉쭏??議곗젅?섏꽭??': 'Adjust quality by selecting bitrate',
    '?뵏 Secure Conversion': '🔒 Secure Conversion',
    '紐⑤뱺 ?뚯씪? 10遺????먮룞?쇰줈 ??젣?⑸땲??': 'All files are automatically deleted after 10 minutes',
    '?뮣 臾대즺 ?ъ슜': '💰 Free to Use',
    '?쒗븳 ?놁씠 臾대즺濡??ъ슜?????덉뒿?덈떎': 'Unlimited free usage',
    
    # Footer
    '?뚯씪 Conversion Tools': 'File Conversion Tools',
}

def fix_file(file_path):
    """파일의 인코딩 문제 수정"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # 모든 교체 수행
        for old, new in SIMPLE_REPLACEMENTS.items():
            content = content.replace(old, new)
        
        # 변경사항이 있으면 저장
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"❌ Error in {file_path.name}: {e}")
        return False

def main():
    public_dir = Path("public")
    
    # 수정할 파일 목록
    files_to_fix = [
        "mp3.html", "wav.html", "ogg.html", "m4a.html", "aac.html",
        "mp4.html", "mov.html", "webm.html", "mkv.html",
        "video-compress.html", "video-gif.html"
    ]
    
    print("🔧 Fixing Korean encoding issues...\n")
    
    fixed = 0
    for filename in files_to_fix:
        filepath = public_dir / filename
        if filepath.exists():
            if fix_file(filepath):
                print(f"✅ Fixed: {filename}")
                fixed += 1
            else:
                print(f"ℹ️  No changes: {filename}")
        else:
            print(f"⚠️  Not found: {filename}")
    
    print(f"\n{'='*60}")
    print(f"✅ Complete! Fixed {fixed} files")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
