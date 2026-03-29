"""
새 블로그 포스트에 Schema 추가 및 Sitemap 업데이트
"""
from pathlib import Path

# BlogPosting Schema 템플릿
def get_blog_schema(title, description, url):
    return f'''
    <!-- Schema.org BlogPosting Structured Data -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "{title}",
      "description": "{description}",
      "image": "https://convert4u.keero.site/og-image.png",
      "author": {{
        "@type": "Organization",
        "name": "Convert4U"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "Convert4U",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://convert4u.keero.site/og-image.png"
        }}
      }},
      "datePublished": "2026-01-15",
      "dateModified": "2026-01-15",
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://convert4u.keero.site{url}"
      }}
    }}
    </script>
'''

def add_schema_to_blog(file_path, title, description, url):
    """블로그 포스트에 Schema 추가"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'BlogPosting' in content:
            return False
        
        schema = get_blog_schema(title, description, url)
        content = content.replace('</body>', schema + '\n</body>')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    public_dir = Path("public")
    
    print("🔧 Adding Schema to new blog post...\n")
    
    # Video format guide에 Schema 추가
    blog_file = public_dir / "blog/video-format-guide.html"
    if blog_file.exists():
        if add_schema_to_blog(
            blog_file,
            "Video Format Guide: MP4 vs MOV vs WebM vs MKV",
            "Complete guide to video formats. Compare MP4, MOV, WebM, and MKV to choose the best format for your needs.",
            "/blog/video-format-guide.html"
        ):
            print("✅ Added BlogPosting schema to video-format-guide.html")
    
    print(f"\n{'='*60}")
    print(f"✅ Schema added!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
