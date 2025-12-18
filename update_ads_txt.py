import requests
from pathlib import Path

# 도메인 설정
DOMAIN = "keero.site"
EZOIC_URL = f"https://srv.adstxtmanager.com/19390/{DOMAIN}"

# ads.txt 파일 경로
ADS_TXT_PATH = Path(__file__).parent / "public" / "ads.txt"

def update_ads_txt():
    """Ezoic에서 최신 ads.txt를 다운로드하여 업데이트합니다."""
    try:
        print(f"🔄 Ezoic에서 ads.txt 다운로드 중...")
        print(f"📍 URL: {EZOIC_URL}")
        
        # Ezoic에서 ads.txt 다운로드
        response = requests.get(EZOIC_URL)
        response.raise_for_status()
        
        # 파일 저장
        with open(ADS_TXT_PATH, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"✅ ads.txt 업데이트 완료!")
        print(f"📄 저장 위치: {ADS_TXT_PATH}")
        print(f"\n📋 내용 미리보기:")
        print("-" * 50)
        lines = response.text.strip().split('\n')
        for line in lines[:10]:  # 처음 10줄만 표시
            print(line)
        if len(lines) > 10:
            print(f"... (총 {len(lines)}줄)")
        print("-" * 50)
        
        return True
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"❌ 오류: Ezoic에 사이트가 등록되지 않았습니다.")
            print(f"👉 먼저 Ezoic 대시보드에서 '{DOMAIN}' 사이트를 등록하세요.")
        else:
            print(f"❌ HTTP 오류: {e}")
        return False
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return False

if __name__ == '__main__':
    print("=" * 50)
    print("🎯 Ezoic ads.txt 자동 업데이트")
    print("=" * 50)
    update_ads_txt()
