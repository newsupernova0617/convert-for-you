"""
한글 인코딩 문제 수정 도구
깨진 한글을 영어로 교체합니다.
"""
import os
import re
from pathlib import Path

# 파일별 교체 매핑
REPLACEMENTS = {
    # 공통 패턴
    r'\?렦': '🎵',
    r'\?뚯꽦': 'Audio',
    r'\?뚯씪': 'file',
    r'蹂?섑븯?몄슂': 'Convert',
    r'蹂??': 'Convert',
    r'\?ъ슜': 'Use',
    r'\?좏깮': 'Select',
    r'\?뱀뀡': 'Section',
    r'怨듦컙': 'Space',
    r'\?먮룞': 'Auto',
    r'??젣': 'Delete',
    r'鍮꾪듃\?덉씠??': 'Bitrate',
    r'\?덉쭏': 'Quality',
    r'\?쒖?': 'Recommended',
    r'理쒓퀬': 'Best',
    r'理쒖??': 'Minimum',
    r'\?믪?': 'High',
    r'\?쒗븳': 'Unlimited',
    r'臾대즺': 'Free',
    r'\?ъ슜\????덉뒿?덈떎': 'Free to use',
    r'怨좎냽': 'Fast',
    r'\?붿쭊': 'Engine',
    r'鍮좊Ⅴ寃?': 'Quickly',
    r'蹂?섑빀?덈떎': 'Convert',
    r'\?덉쭏 議곗젅': 'Quality Control',
    r'鍮꾪듃\?덉씠?몃?': 'Bitrate',
    r'\?좏깮\?섏뿬': 'Select',
    r'議곗젅\?섏꽭??': 'Adjust',
    r'蹂댁븞': 'Security',
    r'蹂?섑솚': 'Conversion',
    r'紐⑤뱺': 'All',
    r'10遺?': '10 minutes',
    r'\?먮룞\?쇰줈': 'Automatically',
    r'臾대즺濡?': 'For free',
    r'\?ъ슜\????덉뒿?덈떎': 'Available for free',
    r'\?랃툘': 'Rich',
    r'肄섑뀗痢?': 'Content',
    r'\?뱀뀡': 'Section',
    r'異붽?': 'Additional',
    r'\?뮕': 'Detailed',
    r'媛?대뱶': 'Guide',
    r'\?곸꽭': 'Detailed',
    r'\?먯＜': 'Frequently',
    r'臾삳뒗': 'Asked',
    r'吏덈Ц': 'Questions',
    r'\?뚯씪': 'File',
    r'Conversion Tools': 'Conversion Tools',
    r'All rights reserved': 'All rights reserved',
    
    # 비디오/오디오 관련
    r'鍮꾨뵒??': 'Video',
    r'\?뚯꽦': 'Audio',
    r'File Size': 'File Size',
    r'以꾩씠湲?': 'Reduce',
    r'蹂?섑솚': 'Convert',
    
    # 이모지 관련
    r'\?뱞': '📝',
    r'\?뱤': '📊',
    r'\?렞': '📽️',
    r'\?뱷': '📄',
    r'\?뼹截?': '🖼️',
    r'\?렓': '🖼️',
    r'\?뱫': '✂️',
    r'\?뱴': '🔗',
    r'\?뿙截?': '🗜️',
    r'\?렒': '🎵',
    r'\?렯': '🎵',
    r'\?렗': '🎬',
    r'\?렏': '🎬',
    r'\?벞': '🎬',
    r'\?렄截?': '🎞️',
    r'\?뱪': '📐',
    r'\?벑': '📱',
    r'??': '⚡',
    
    # 한글 문장을 영어로
    r'\?뚯꽦 \?뚯씪\??MP3 Format\?쇰줈 蹂?섑븯?몄슂': 'Convert audio files to MP3 format',
    r'Select Again': 'Select Again',
    r'Another File': 'Convert Another File',
    r'Download': 'Download',
}

def fix_encoding_in_file(file_path):
    """단일 파일의 인코딩 문제 수정"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original_content = content
        
        # 각 패턴 교체
        for pattern, replacement in REPLACEMENTS.items():
            content = re.sub(pattern, replacement, content)
        
        # 변경사항이 있으면 저장
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ 오류 ({file_path}): {e}")
        return False

def main():
    """인코딩 문제가 있는 파일들 수정"""
    public_dir = Path("public")
    
    # 문제가 있는 것으로 알려진 파일들
    problem_files = [
        "mp3.html", "wav.html", "ogg.html", "m4a.html", "aac.html",
        "mp4.html", "mov.html", "webm.html", "mkv.html",
        "video-compress.html", "video-gif.html"
    ]
    
    print("🔧 한글 인코딩 문제 수정 중...\n")
    
    fixed_count = 0
    
    for filename in problem_files:
        file_path = public_dir / filename
        if file_path.exists():
            if fix_encoding_in_file(file_path):
                fixed_count += 1
                print(f"✅ {filename} 수정 완료")
            else:
                print(f"ℹ️  {filename} 변경사항 없음")
        else:
            print(f"⚠️  {filename} 파일을 찾을 수 없음")
    
    print(f"\n{'='*60}")
    print(f"✅ 작업 완료! {fixed_count}개 파일 수정됨")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
