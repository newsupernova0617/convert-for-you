import os
import re
from pathlib import Path

# 새로운 스크립트들
GATEKEEPER_SCRIPTS = '''<script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js"></script>
<script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js"></script>
'''

EZOIC_SCRIPTS = '''<script async src="//www.ezojs.com/ezoic/sa.min.js"></script>
<script>
    window.ezstandalone = window.ezstandalone || {};
    ezstandalone.cmd = ezstandalone.cmd || [];
</script>
'''

ALL_SCRIPTS = GATEKEEPER_SCRIPTS + EZOIC_SCRIPTS

def clean_and_add_scripts(file_path):
    """HTML 파일에서 기존 스크립트를 제거하고 새로 추가합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 기존 Gatekeeper 스크립트 제거 (여러 패턴 처리)
        content = re.sub(
            r'<script\s+data-cfasync="false"\s+src="https://cmp\.gatekeeperconsent\.com/min\.js"></script>\s*\n?',
            '',
            content,
            flags=re.IGNORECASE
        )
        content = re.sub(
            r'<script\s+data-cfasync="false"\s+src="https://the\.gatekeeperconsent\.com/cmp\.min\.js"></script>\s*\n?',
            '',
            content,
            flags=re.IGNORECASE
        )
        
        # 기존 Ezoic 스크립트 제거
        content = re.sub(
            r'<script\s+async\s+src="//www\.ezojs\.com/ezoic/sa\.min\.js"></script>\s*\n?',
            '',
            content,
            flags=re.IGNORECASE
        )
        content = re.sub(
            r'<script>\s*window\.ezstandalone\s*=\s*window\.ezstandalone\s*\|\|\s*{};\s*ezstandalone\.cmd\s*=\s*ezstandalone\.cmd\s*\|\|\s*\[\];\s*</script>\s*\n?',
            '',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )
        
        # <head> 태그 찾기
        pattern = r'(<head[^>]*>)'
        
        if not re.search(pattern, content, re.IGNORECASE):
            print(f"⚠️  {file_path.name} - <head> 태그를 찾을 수 없습니다")
            return False
        
        # <head> 바로 다음에 스크립트 추가
        new_content = re.sub(
            pattern,
            r'\1\n' + ALL_SCRIPTS,
            content,
            count=1,
            flags=re.IGNORECASE
        )
        
        # 변경사항이 있는지 확인
        if new_content == original_content:
            print(f"⏭️  {file_path.name} - 이미 최신 상태입니다")
            return False
        
        # 파일 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ {file_path.name} - 스크립트 업데이트 완료")
        return True
        
    except Exception as e:
        print(f"❌ {file_path.name} - 오류 발생: {str(e)}")
        return False

def main():
    # public 폴더의 모든 HTML 파일 찾기
    public_dir = Path(__file__).parent / 'public'
    html_files = list(public_dir.glob('*.html'))
    
    print(f"\n🔍 {len(html_files)}개의 HTML 파일을 찾았습니다\n")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for html_file in sorted(html_files):
        result = clean_and_add_scripts(html_file)
        if result is True:
            updated_count += 1
        elif result is False:
            skipped_count += 1
        else:
            error_count += 1
    
    print(f"\n{'='*50}")
    print(f"✅ 업데이트 완료: {updated_count}개")
    print(f"⏭️  건너뜀: {skipped_count}개")
    print(f"❌ 오류: {error_count}개")
    print(f"{'='*50}\n")

if __name__ == '__main__':
    main()
