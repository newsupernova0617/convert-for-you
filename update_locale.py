import os
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(r"C:\Users\yj437\OneDrive\Desktop\coding_windows\convert-for-you\public")

def update_locale_to_english(filepath):
    """HTML 파일의 locale을 영어로 변경"""
    filename = os.path.basename(filepath)
    
    # Skip Google verification file
    if filename.startswith('google'):
        print(f"⏭️  Skipping {filename}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # HTML lang 속성 변경: ko -> en
        content = content.replace('<html lang="ko">', '<html lang="en">')
        
        # OG locale 변경: ko_KR -> en_US
        content = content.replace('content="ko_KR"', 'content="en_US"')
        
        # 변경사항이 없으면 건너뛰기
        if content == original_content:
            print(f"⏭️  Skipping {filename} (already English)")
            return False
        
        # 파일 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Updated locale in {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {filename}: {str(e)}")
        return False

def main():
    """모든 HTML 파일 처리"""
    print("🌍 Updating locale to English (en_US)...\n")
    
    updated_count = 0
    skipped_count = 0
    
    # public 폴더의 모든 HTML 파일 처리
    for html_file in sorted(BASE_DIR.glob("*.html")):
        if update_locale_to_english(html_file):
            updated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Updated: {updated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"\n🌍 Locale update complete!")

if __name__ == "__main__":
    main()
