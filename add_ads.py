import os
import re
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(r"C:\Users\yj437\OneDrive\Desktop\coding_windows\convert-for-you\public")

# 광고 스크립트 코드
AD_SCRIPTS = '''  <!-- Ad Scripts -->
  <script type="text/javascript" src="https://pl28277395.effectivegatecpm.com/f4/35/e9/f435e9d2d25f0d94460639b4ae57f586.js"></script>
  <script type="text/javascript" src="https://pl28277425.effectivegatecpm.com/ed/11/cb/ed11cbb86d17c5eb22a1bd39327dbead.js"></script>
  <script type="text/javascript" src="https://pl28277454.effectivegatecpm.com/55/5e/36/555e368648222ea40b4f7a2d84010791.js"></script>
  <script type="text/javascript" src="https://pl28277656.effectivegatecpm.com/8a/99/68/8a99687f130453b6e902566e42317ecf.js"></script>
'''

def add_ad_scripts(filepath):
    """HTML 파일의 </body> 태그 직전에 광고 스크립트 추가"""
    filename = os.path.basename(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 이미 광고 스크립트가 있는지 확인
        if 'effectivegatecpm.com' in content:
            print(f"⏭️  Skipping {filename} (ad scripts already exist)")
            return False
        
        # </body> 태그를 찾아서 그 직전에 광고 코드 삽입
        if '</body>' not in content:
            print(f"⚠️  Warning: {filename} has no </body> tag")
            return False
        
        # </body> 직전에 광고 스크립트 추가
        updated_content = content.replace('</body>', f'{AD_SCRIPTS}</body>')
        
        # 파일 저장
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Added ad scripts to {filename}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {filename}: {str(e)}")
        return False

def main():
    """모든 HTML 파일 처리"""
    print("🚀 Adding ad scripts to all HTML files...\n")
    
    updated_count = 0
    skipped_count = 0
    
    # public 폴더의 모든 HTML 파일 처리
    for html_file in BASE_DIR.glob("*.html"):
        if add_ad_scripts(html_file):
            updated_count += 1
        else:
            skipped_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Updated: {updated_count} files")
    print(f"   ⏭️  Skipped: {skipped_count} files")
    print(f"\n🎉 Ad scripts added successfully!")

if __name__ == "__main__":
    main()
