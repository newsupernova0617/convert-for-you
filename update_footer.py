"""
Footer 일괄 업데이트 도구
모든 HTML 파일의 Footer를 표준 템플릿으로 교체
"""
from pathlib import Path
import re

# 표준 Footer 템플릿
STANDARD_FOOTER = '''  <footer class="bg-dark text-light mt-5">
    <div class="container py-5">
      <div class="row g-4">
        <div class="col-md-4">
          <h5 class="fw-bold mb-3 text-primary">Convert4U</h5>
          <p class="text-muted small">The ultimate playground for file conversion. Fast, free, and secure toolset for everyday digital tasks.</p>
        </div>
        <div class="col-md-2">
          <h6 class="fw-bold mb-3">Information</h6>
          <ul class="list-unstyled small">
            <li><a href="/about.html" class="text-muted text-decoration-none">About Us</a></li>
            <li><a href="/privacy-policy.html" class="text-muted text-decoration-none">Privacy Policy</a></li>
            <li><a href="/terms-of-service.html" class="text-muted text-decoration-none">Terms of Service</a></li>
            <li><a href="/contact.html" class="text-muted text-decoration-none">Contact Us</a></li>
          </ul>
        </div>
        <div class="col-md-2">
          <h6 class="fw-bold mb-3">Support</h6>
          <ul class="list-unstyled small">
            <li><a href="/faq.html" class="text-muted text-decoration-none">FAQ</a></li>
            <li><a href="/user-guide.html" class="text-muted text-decoration-none">User Guide</a></li>
            <li><a href="/feature-request.html" class="text-muted text-decoration-none">Feature Request</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h6 class="fw-bold mb-3">Our Mission</h6>
          <p class="text-muted small">We strive to provide premium conversion technology to everyone for free. No login, no credit cards, just results.</p>
        </div>
      </div>
      <hr class="bg-secondary my-4">
      <div class="text-center text-muted small">
        <p class="mb-0">&copy; 2024-2026 Convert4U. Commitment to excellence in file conversion.</p>
      </div>
    </div>
  </footer>'''

def update_footer(file_path):
    """파일의 Footer를 표준 템플릿으로 교체"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # <footer> 태그 찾기
        footer_pattern = r'<footer[^>]*>.*?</footer>'
        
        if re.search(footer_pattern, content, re.DOTALL):
            # 기존 Footer를 표준 템플릿으로 교체
            new_content = re.sub(footer_pattern, STANDARD_FOOTER, content, flags=re.DOTALL)
            
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
    
    print(f"🔧 Updating footer in {len(html_files)} files...\n")
    
    updated = 0
    for html_file in html_files:
        if update_footer(html_file):
            print(f"✅ Updated: {html_file.relative_to(public_dir)}")
            updated += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Complete! Updated {updated} files")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
