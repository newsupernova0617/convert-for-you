"""
네비게이션 일괄 업데이트 도구
모든 HTML 파일의 네비게이션을 표준 템플릿으로 교체
"""
from pathlib import Path
import re

# 표준 네비게이션 템플릿
STANDARD_NAV = '''  <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
    <div class="container">
      <a class="navbar-brand fw-bold text-primary fs-3" href="/">Convert4U</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto fw-semibold">
          <li class="nav-item"><a class="nav-link" href="/blog/">Blog</a></li>
          <li class="nav-item"><a class="nav-link" href="/user-guide.html">User Guide</a></li>
          <li class="nav-item"><a class="nav-link" href="/faq.html">FAQ</a></li>
          <li class="nav-item"><a class="nav-link" href="/about.html">About</a></li>
          <li class="nav-item"><a class="nav-link" href="/contact.html">Contact</a></li>
        </ul>
      </div>
    </div>
  </nav>'''

def update_navigation(file_path):
    """파일의 네비게이션을 표준 템플릿으로 교체"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # <nav> 태그 찾기 (여러 줄에 걸쳐 있을 수 있음)
        nav_pattern = r'<nav[^>]*navbar[^>]*>.*?</nav>'
        
        if re.search(nav_pattern, content, re.DOTALL):
            # 기존 네비게이션을 표준 템플릿으로 교체
            new_content = re.sub(nav_pattern, STANDARD_NAV, content, flags=re.DOTALL)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ Error in {file_path.name}: {e}")
        return False

def main():
    public_dir = Path("public")
    
    # 모든 HTML 파일 찾기
    html_files = list(public_dir.rglob("*.html"))
    
    # Google verification 파일 제외
    html_files = [f for f in html_files if not f.name.startswith('google')]
    
    print(f"🔧 Updating navigation in {len(html_files)} files...\n")
    
    updated = 0
    for html_file in html_files:
        if update_navigation(html_file):
            print(f"✅ Updated: {html_file.relative_to(public_dir)}")
            updated += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Complete! Updated {updated} files")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
