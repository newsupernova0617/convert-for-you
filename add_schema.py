"""
Schema.org 구조화 데이터 일괄 추가 도구
FAQ 페이지와 블로그 포스트에 Schema.org 데이터를 추가합니다.
"""
from pathlib import Path
import re

# FAQ Schema 템플릿
FAQ_SCHEMA = '''
    <!-- Schema.org FAQPage Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is Convert4U really free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our basic conversion tools are completely free to use. We support our operations through premium advertising."
          }
        },
        {
          "@type": "Question",
          "name": "Do I need to install any software?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No installation is required. Convert4U is 100% web-based and works directly in your browser on Windows, Mac, Linux, and mobile devices."
          }
        },
        {
          "@type": "Question",
          "name": "Are my files safe after conversion?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. We use SSL encryption for every transfer. All uploaded and converted files are automatically deleted from our servers within 1 hour."
          }
        },
        {
          "@type": "Question",
          "name": "What is the maximum file size limit?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For the free tier, we support file uploads up to 50MB. Merging multiple PDFs allows a combined limit of 100MB."
          }
        }
      ]
    }
    </script>
'''

# BlogPosting Schema 템플릿 (동적으로 생성)
def get_blog_schema(title, description, url, date_published="2026-01-15"):
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
      "datePublished": "{date_published}",
      "dateModified": "{date_published}",
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://convert4u.keero.site{url}"
      }}
    }}
    </script>
'''

def add_faq_schema(file_path):
    """FAQ 페이지에 Schema 추가"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 이미 Schema가 있는지 확인
        if 'FAQPage' in content:
            return False
        
        # </body> 태그 앞에 Schema 추가
        content = content.replace('</body>', FAQ_SCHEMA + '\n</body>')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def add_blog_schema(file_path, title, description, url):
    """블로그 포스트에 Schema 추가"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 이미 Schema가 있는지 확인
        if 'BlogPosting' in content:
            return False
        
        schema = get_blog_schema(title, description, url)
        
        # </body> 태그 앞에 Schema 추가
        content = content.replace('</body>', schema + '\n</body>')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    public_dir = Path("public")
    
    print("🔧 Adding Schema.org structured data...\n")
    
    # FAQ 페이지에 Schema 추가
    faq_file = public_dir / "faq.html"
    if faq_file.exists():
        if add_faq_schema(faq_file):
            print("✅ Added FAQPage schema to faq.html")
        else:
            print("ℹ️  faq.html already has schema or error occurred")
    
    # 블로그 포스트에 Schema 추가
    blog_posts = [
        {
            "file": "blog/jpg-vs-png-vs-webp.html",
            "title": "JPG vs PNG vs WebP: Which Format Should You Use?",
            "description": "Understand the differences between major image formats and how to choose the right one for your website or project.",
            "url": "/blog/jpg-vs-png-vs-webp.html"
        },
        {
            "file": "blog/how-to-compress-pdf.html",
            "title": "How to Compress PDF Without Losing Quality",
            "description": "Learn the professional way to shrink PDFs while keeping them crisp and clear.",
            "url": "/blog/how-to-compress-pdf.html"
        },
        {
            "file": "blog/online-file-security.html",
            "title": "Are Online File Converters Safe? 5 Things to Check",
            "description": "Learn how to identify secure conversion services and protect your sensitive information.",
            "url": "/blog/online-file-security.html"
        },
        {
            "file": "blog/heic-format-guide.html",
            "title": "HEIC Format Explained: Managing iPhone Photos Better",
            "description": "Learn what HEIC format is, why Apple uses it, and how to convert HEIC photos for universal compatibility.",
            "url": "/blog/heic-format-guide.html"
        },
        {
            "file": "blog/pdf-compression-methods.html",
            "title": "5 Ways to Reduce PDF File Size Without Losing Quality",
            "description": "Professional techniques for PDF compression. From online tools to advanced settings, discover the best methods.",
            "url": "/blog/pdf-compression-methods.html"
        },
        {
            "file": "blog/audio-format-comparison.html",
            "title": "Audio Format Comparison: MP3 vs WAV vs OGG vs FLAC",
            "description": "Complete guide to audio formats. Compare quality, file size, and compatibility to choose the best format.",
            "url": "/blog/audio-format-comparison.html"
        }
    ]
    
    for post in blog_posts:
        file_path = public_dir / post["file"]
        if file_path.exists():
            if add_blog_schema(file_path, post["title"], post["description"], post["url"]):
                print(f"✅ Added BlogPosting schema to {post['file']}")
            else:
                print(f"ℹ️  {post['file']} already has schema or error occurred")
    
    print(f"\n{'='*60}")
    print(f"✅ Schema.org structured data added!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
