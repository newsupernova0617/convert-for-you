"""
광고 스크립트 일괄 제거 도구
AdSense 승인 전까지 모든 광고 관련 스크립트를 제거합니다.
"""
import os
import re
from pathlib import Path

# 제거할 스크립트 패턴들
AD_PATTERNS = [
    # Gatekeeper Consent
    r'<script[^>]*src="https://cmp\.gatekeeperconsent\.com[^"]*"[^>]*>.*?</script>',
    r'<script[^>]*src="https://the\.gatekeeperconsent\.com[^"]*"[^>]*>.*?</script>',
    
    # Ezoic
    r'<script[^>]*src="[^"]*ezojs\.com[^"]*"[^>]*>.*?</script>',
    r'<script>\s*window\.ezstandalone\s*=.*?</script>',
    
    # AdSense placeholder
    r'<ins class="adsbygoogle"[^>]*>.*?</ins>',
    r'<script>\s*\(adsbygoogle\s*=\s*window\.adsbygoogle.*?\)\.push\({}\);?\s*</script>',
    
    # effectivegatecpm
    r'<script[^>]*src="[^"]*effectivegatecpm\.com[^"]*"[^>]*>.*?</script>',
    
    # Ad containers/sections
    r'<div[^>]*class="[^"]*ad-placeholder[^"]*"[^>]*>.*?</div>',
    r'<div[^>]*class="[^"]*ad-container[^"]*"[^>]*>.*?</div>',
    r'<div[^>]*class="[^"]*ad-label[^"]*"[^>]*>.*?</div>',
    r'<section[^>]*class="[^"]*ad-section[^"]*"[^>]*>.*?</section>',
]

def remove_ads_from_file(file_path):
    """단일 HTML 파일에서 광고 스크립트 제거"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        removed_count = 0
        
        # 각 패턴에 대해 제거
        for pattern in AD_PATTERNS:
            matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
            if matches:
                removed_count += len(matches)
                content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # 변경사항이 있으면 파일 저장
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return removed_count
        
        return 0
        
    except Exception as e:
        print(f"❌ 오류 ({file_path}): {e}")
        return 0

def main():
    """모든 HTML 파일 처리"""
    public_dir = Path("public")
    
    if not public_dir.exists():
        print("❌ public 디렉토리를 찾을 수 없습니다.")
        return
    
    # 모든 HTML 파일 찾기
    html_files = list(public_dir.rglob("*.html"))
    
    print(f"📁 {len(html_files)}개의 HTML 파일을 찾았습니다.\n")
    
    total_removed = 0
    modified_files = []
    
    for html_file in html_files:
        removed = remove_ads_from_file(html_file)
        if removed > 0:
            total_removed += removed
            modified_files.append(html_file)
            print(f"✅ {html_file.relative_to(public_dir)}: {removed}개 제거")
    
    print(f"\n{'='*60}")
    print(f"✅ 작업 완료!")
    print(f"📊 수정된 파일: {len(modified_files)}개")
    print(f"📊 제거된 광고 요소: {total_removed}개")
    print(f"{'='*60}\n")
    
    if modified_files:
        print("수정된 파일 목록:")
        for f in modified_files[:10]:  # 처음 10개만 표시
            print(f"  - {f.relative_to(public_dir)}")
        if len(modified_files) > 10:
            print(f"  ... 외 {len(modified_files) - 10}개")

if __name__ == "__main__":
    main()
