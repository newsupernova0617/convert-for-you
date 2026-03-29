#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final cleanup - Remove ALL remaining corrupted characters
"""

import os
import re

def final_cleanup(filepath):
    """Remove all remaining corrupted Korean characters"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        original_content = content
        
        # Remove all remaining corrupted Korean characters (they appear as ? followed by Korean syllables)
        # Pattern: Any sequence of ? followed by Korean characters
        content = re.sub(r'\?[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff]+', '', content)
        
        # Fix specific remaining issues
        content = re.sub(r'<h1>[^<]*?WAV Converter</h1>', '<h1>🎵 WAV Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?OGG Converter</h1>', '<h1>🎵 OGG Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?M4A Converter</h1>', '<h1>🎵 M4A Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?AAC Converter</h1>', '<h1>🎵 AAC Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?MP4 Converter</h1>', '<h1>🎬 MP4 Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?MOV Converter</h1>', '<h1>🎬 MOV Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?MKV Converter</h1>', '<h1>🎬 MKV Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?WebM Converter</h1>', '<h1>🎬 WebM Converter</h1>', content)
        content = re.sub(r'<h1>[^<]*?Video Compress</h1>', '<h1>🗜️ Video Compress</h1>', content)
        content = re.sub(r'<h1>[^<]*?Video to GIF</h1>', '<h1>🎞️ Video to GIF</h1>', content)
        
        # Fix upload area
        content = re.sub(r'<strong>[^<]*?</strong>', '<strong>Drag and drop your file or click to upload</strong>', content, count=1)
        
        # Only write if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Cleaned: {os.path.basename(filepath)}")
            return True
        else:
            print(f"⏭️  Already clean: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"❌ Error cleaning {filepath}: {e}")
        return False

def main():
    """Clean all files"""
    public_dir = 'public'
    
    files_to_clean = [
        'wav.html',
        'ogg.html',
        'm4a.html',
        'aac.html',
        'mp4.html',
        'mov.html',
        'mkv.html',
        'webm.html',
        'video-compress.html',
        'video-gif.html',
    ]
    
    cleaned_count = 0
    for filename in files_to_clean:
        filepath = os.path.join(public_dir, filename)
        if os.path.exists(filepath):
            if final_cleanup(filepath):
                cleaned_count += 1
        else:
            print(f"⚠️  File not found: {filename}")
    
    print(f"\n🎉 Complete! Cleaned {cleaned_count} files.")

if __name__ == '__main__':
    main()
