import os
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(r"C:\Users\yj437\OneDrive\Desktop\coding_windows\convert-for-you\public")

def remove_ad_fix_css(filepath):
    """HTML 파일에서 ad-fix.css 링크 제거"""
    filename = os.path.basename(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # ad-fix.css가 없으면 건너뛰기
        if 'ad-fix.css' not in content:
            print(f"⏭️  Skipping {filename} (no ad-fix.css found)")
            return False
        
        # ad-fix.css 링크 제거
        updated_content = content.replace('  <link rel="stylesheet" href="ad-fix.css">\n', '')
        
        # 파일 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Removed ad-fix.css from {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {filename}: {str(e)}")
        return False

def main():
    """모든 HTML 파일 처리"""
    print("🚀 Removing ad-fix.css from all HTML files...\n")
    
    updated_count = 0
    skipped_count = 0
    
    # public 폴더의 모든 HTML 파일 처리
    for html_file in BASE_DIR.glob("*.html"):
        if remove_ad_fix_css(html_file):
            updated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Removed: {updated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"\n🎉 Ad-fix CSS removed successfully!")

if __name__ == "__main__":
    main()
