#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix encoding issues in HTML files by replacing corrupted Korean text with English
"""

import os
import re

# Define the replacements
replacements = {
    # Hero section
    r'\?뚯꽦 \?뚯씪\?\?(\w+) Format\?쇰줈 蹂\?섑븯\?몄슂': r'Convert your audio files to \1 format',
    r'\?뚯꽦 \?뚯씪\?\?(\w+) 鍮꾨뵒\? Format\?쇰줈 蹂\?섑븯\?몄슂': r'Convert your video files to \1 format',
    r'鍮꾨뵒\?\? \?뚯씪\?\?(\w+) Format\?쇰줈 蹂\?섑븯\?몄슂': r'Convert your video files to \1 format',
    r'鍮꾨뵒\?\? \?뚯씪 \?ъ씠利?\? 以\?씠\?몄슂': r'Reduce your video file size',
    r'鍮꾨뵒\?\? \?뚯씪\?\?GIF\?쇰줈 蹂\?섑븯\?몄슂': r'Convert your video files to GIF',
    
    # Upload area
    r'\?뱚': r'🎵',
    r'\?렗': r'🎬',
    r'\?뿙截\?': r'🗜️',
    r'\?렄截\?': r'🎞️',
    r'\?ш린\?\?\?\?뚯씪\?\?\?\?뚯뼱\?볤굅\?\?\?\?대┃\?섏뿬 \?낅줈\?\?': r'Drag and drop your audio file or click to upload',
    r'\?ш린\?\?\?鍮꾨뵒\? \?뚯씪\?\?\?뚯뼱\?볤굅\?\?\?\?대┃\?섏뿬 \?낅줈\?\?': r'Drag and drop your video file or click to upload',
    
    # Buttons and labels
    r'(\d+) kbps \(理쒓퀬 \?덉쭏\)': r'\1 kbps (Highest Quality)',
    r'\?렦 (\w+)濡\?蹂\?\?': r'⚡ Convert to \1',
    r'\?\?蹂\?\?以\?\.\.': r'Converting...',
    r'(\w+)濡\?蹂\?\?': r'Convert to \1',
    r'蹂\?\?以\?\.\.': r'Converting...',
    r'\?좉퉸留\?湲곕떎\?ㅼ＜\?몄슂\.': r'Please wait a moment.',
    r'蹂\?\?\?\?꾨즺!': r'Conversion Complete!',
    r'Another File 蹂\?\?\?': r'Convert Another File',
    
    # Features section
    r'\?\?Key Features': r'⚡ Key Features',
    r'\?\? Fast Conversion': r'⚡ Fast Conversion',
    r'怨좎냽 FFmpeg \?붿쭊\?쇰줈 鍮좊Ⅴ寃\?蹂\?섑빀\?덈떎': r'Lightning-fast conversion using FFmpeg engine',
    r'\?럻截\?\?\?덉쭏 議곗젅': r'🎚️ Quality Control',
    r'Adjust quality by selecting bitrate/p\>': r'Adjust quality by selecting bitrate</p>',
    r'紐⑤뱺 \?뚯씪\? 10遺\?\?\?\?\?먮룞\?쇰줈 \?\?젣\?⑸땲\?\?': r'All files are automatically deleted after 10 minutes',
    
    # Converter tool icons
    r'\?뱞': r'📝',
    r'\?뱤': r'📊',
    r'\?렞': r'📊',
    r'\?뼹截\?': r'🖼️',
    r'\?렓': r'🖼️',
    r'\?뿙截\?': r'🗜️',
    r'\?뱫': r'✂️',
    r'\?뱴': r'🔗',
    r'\?뱷': r'📄',
    r'\?벑': r'📱',
    r'\?\?': r'⚡',
    r'\?뱪': r'📐',
    r'\?렒': r'🎵',
    r'\?렯': r'🎵',
    r'\?렏': r'🎬',
    r'\?벞': r'🎬',
    
    # Converter tool labels
    r'Apple Format\?\?JPG濡\?': r'Apple Format to JPG',
    r'Apple Format\?\?PNG濡\?': r'Apple Format to PNG',
    r'理쒖떊 Format\?쇰줈 理쒖쟻\?\?': r'Optimize to next-gen format',
    r'PDF File Size 以꾩씠湲\?': r'Reduce PDF File Size',
    r'鍮꾨뵒\?\? File Size 以꾩씠湲\?': r'Reduce Video File Size',
    r'\?\?PDF': r'to PDF',
    
    # Checkmarks and icons
    r'\?뱞 Selected File:': r'✅ Selected File:',
    r'\?\?': r'✅',
    r'\?\?': r'❌',
}

def fix_file(filepath):
    """Fix encoding issues in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for pattern, replacement in replacements.items():
            content = re.sub(pattern, replacement, content)
        
        # Only write if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {os.path.basename(filepath)}")
            return True
        else:
            print(f"⏭️  No changes needed: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"❌ Error fixing {filepath}: {e}")
        return False

def main():
    """Fix all affected HTML files"""
    public_dir = 'public'
    
    # List of files to fix
    files_to_fix = [
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
    
    fixed_count = 0
    for filename in files_to_fix:
        filepath = os.path.join(public_dir, filename)
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {filename}")
    
    print(f"\n🎉 Complete! Fixed {fixed_count} out of {len(files_to_fix)} files.")

if __name__ == '__main__':
    main()
