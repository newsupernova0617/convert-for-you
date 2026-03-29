"""
Favicon 최적화 스크립트
5MB+ 파일을 32x32 또는 64x64 크기로 최적화
"""
from PIL import Image
import os

# 파일 경로
input_path = "public/favicon.png"
output_path = "public/favicon_optimized.png"
backup_path = "public/favicon_original.png"

try:
    # 원본 백업
    if os.path.exists(input_path):
        print(f"📁 원본 파일 크기: {os.path.getsize(input_path) / 1024 / 1024:.2f} MB")
        
        # 백업 생성
        if not os.path.exists(backup_path):
            os.rename(input_path, backup_path)
            print(f"✅ 원본을 {backup_path}로 백업했습니다.")
        
        # 이미지 열기
        img = Image.open(backup_path)
        print(f"📐 원본 크기: {img.size}")
        
        # 32x32로 리사이즈 (favicon 표준 크기)
        img_resized = img.resize((32, 32), Image.Resampling.LANCZOS)
        
        # PNG로 최적화 저장
        img_resized.save(input_path, "PNG", optimize=True)
        
        new_size = os.path.getsize(input_path)
        print(f"✅ 최적화 완료!")
        print(f"📁 새 파일 크기: {new_size / 1024:.2f} KB")
        print(f"📐 새 크기: 32x32")
        print(f"💾 용량 절감: {(1 - new_size / os.path.getsize(backup_path)) * 100:.1f}%")
        
    else:
        print(f"❌ 파일을 찾을 수 없습니다: {input_path}")

except Exception as e:
    print(f"❌ 오류 발생: {e}")
    print("Pillow 라이브러리가 필요합니다: pip install Pillow")
