import os
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(r"C:\Users\yj437\OneDrive\Desktop\coding_windows\convert-for-you\public")

def add_ad_fix_css(filepath):
    """HTML 파일의 </head> 태그 직전에 ad-fix.css 추가"""
    filename = os.path.basename(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 이미 ad-fix.css가 있는지 확인
        if 'ad-fix.css' in content:
            print(f"⏭️  Skipping {filename} (ad-fix.css already exists)")
            return False
        
        # </head> 태그를 찾아서 그 직전에 CSS 링크 삽입
        if '</head>' not in content:
            print(f"⚠️  Warning: {filename} has no </head> tag")
            return False
        
        # </head> 직전에 ad-fix CSS 추가
        ad_fix_link = '  <link rel="stylesheet" href="ad-fix.css">\n</head>'
        updated_content = content.replace('</head>', ad_fix_link)
        
        # 파일 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Added ad-fix.css to {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {filename}: {str(e)}")
        return False

def main():
    """모든 HTML 파일 처리"""
    print("🚀 Adding ad-fix.css to all HTML files...\n")
    
    updated_count = 0
    skipped_count = 0
    
    # public 폴더의 모든 HTML 파일 처리
    for html_file in BASE_DIR.glob("*.html"):
        if add_ad_fix_css(html_file):
            updated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Updated: {updated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"\n🎉 Ad-fix CSS added successfully!")

if __name__ == "__main__":
    main()
