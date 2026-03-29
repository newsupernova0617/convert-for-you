#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final comprehensive fix - removes ALL corrupted Korean characters
"""

import os
import re

def comprehensive_fix(filepath):
    """Apply comprehensive fixes to remove all corrupted text"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove ALL patterns of corrupted Korean
        # Pattern 1: Question marks followed by Korean characters
        content = re.sub(r'\?[\uac00-\ud7af]+', '', content)
        
        # Pattern 2: Korean characters mixed with symbols
        content = re.sub(r'[\uac00-\ud7af]+\?', '', content)
        content = re.sub(r'[\uac00-\ud7af]+❌', '', content)
        content = re.sub(r'❌[\uac00-\ud7af]+', '', content)
        
        # Pattern 3: Specific corrupted patterns
        content = re.sub(r'濡\?蹂❌', '', content)
        content = re.sub(r'蹂❌以\?\.\.', 'Converting...', content)
        content = re.sub(r'Another File 蹂❌', 'Convert Another File', content)
        content = re.sub(r'理쒖떊 Format.*?❌', 'Optimize to next-gen format', content)
        content = re.sub(r'鍮꾨뵒❌.*?Format', 'video to format', content)
        content = re.sub(r'紐⑤뱺.*?10遺.*?❌', 'All files are automatically deleted after 10 minutes', content)
        
        # Fix specific button texts that might be empty now
        content = re.sub(r'<button([^>]*?)>\s*</button>', r'<button\1>Convert</button>', content)
        
        # Fix empty spans
        content = re.sub(r'<span([^>]*?)>\s*</span>', r'<span\1>⚡ Convert</span>', content)
        
        # Fix specific known issues
        content = re.sub(r'Office ❌PDF', 'Office to PDF', content)
        content = re.sub(r'Apple Format.*?JPG.*?/p>', 'Apple Format to JPG</p>', content)
        content = re.sub(r'Apple Format.*?PNG.*?/p>', 'Apple Format to PNG</p>', content)
        
        # Fix video-specific issues
        content = re.sub(r'🎬\s*MP4\s*蹂❌', '🎬 Convert to MP4', content)
        content = re.sub(r'🎬\s*MOV\s*蹂❌', '🎬 Convert to MOV', content)
        content = re.sub(r'🎬\s*MKV\s*蹂❌', '🎬 Convert to MKV', content)
        content = re.sub(r'🎬\s*WebM\s*蹂❌', '🎬 Convert to WebM', content)
        
        # Fix quality control text
        content = re.sub(r'❌\?.*?鍮꾪듃.*?❌', 'Adjust quality by selecting bitrate', content)
        content = re.sub(r'📊.*?덉쭏 議곗젅', '🎚️ Quality Control', content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {os.path.basename(filepath)}")
            return True
        else:
            print(f"⏭️  Already clean: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"❌ Error: {filepath}: {e}")
        return False

def main():
    public_dir = 'public'
    
    files_to_fix = [
        'm4a.html',
        'aac.html',
        'mp4.html',
        'mov.html',
        'mkv.html',
        'webm.html',
        'video-compress.html',
        'video-gif.html',
    ]
    
    fixed_count = 0
    for filename in files_to_fix:
        filepath = os.path.join(public_dir, filename)
        if os.path.exists(filepath):
            if comprehensive_fix(filepath):
                fixed_count += 1
    
    print(f"\n🎉 Fixed {fixed_count} files!")

if __name__ == '__main__':
    main()
