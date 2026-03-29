#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix ALL encoding issues by replacing corrupted text with proper English
This script uses a comprehensive approach to catch all corrupted Korean characters
"""

import os
import re

def fix_file_comprehensive(filepath):
    """Fix encoding issues in a single file using comprehensive replacement"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        original_content = content
        
        # Replace all corrupted Korean patterns with English equivalents
        # Hero sections
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?WAV Format[^<]*?</p>', '<p>Convert your audio files to WAV format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?OGG Format[^<]*?</p>', '<p>Convert your audio files to OGG format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?M4A Format[^<]*?</p>', '<p>Convert your audio files to M4A format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?AAC Format[^<]*?</p>', '<p>Convert your audio files to AAC format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?MP4[^<]*?</p>', '<p>Convert your video files to MP4 format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?MOV[^<]*?</p>', '<p>Convert your video files to MOV format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?MKV[^<]*?</p>', '<p>Convert your video files to MKV format</p>', content)
        content = re.sub(r'<p>[^<]*?뚯꽦[^<]*?뚯씪[^<]*?WebM[^<]*?</p>', '<p>Convert your video files to WebM format</p>', content)
        content = re.sub(r'<p>[^<]*?鍮꾨뵒[^<]*?File Size[^<]*?</p>', '<p>Reduce your video file size</p>', content)
        content = re.sub(r'<p>[^<]*?鍮꾨뵒[^<]*?GIF[^<]*?</p>', '<p>Convert your video files to GIF</p>', content)
        
        # Upload area text
        content = re.sub(r'<strong>[^<]*?ш린[^<]*?뚯씪[^<]*?</strong>', '<strong>Drag and drop your audio file or click to upload</strong>', content)
        content = re.sub(r'<strong>[^<]*?ш린[^<]*?鍮꾨뵒[^<]*?</strong>', '<strong>Drag and drop your video file or click to upload</strong>', content)
        
        # Buttons
        content = re.sub(r'<span[^>]*>[^<]*?렦 MP3濡[^<]*?</span>', '<span x-show="!isConverting">⚡ Convert to MP3</span>', content)
        content = re.sub(r'<span[^>]*>[^<]*?蹂[^<]*?以[^<]*?</span>', '<span x-show="isConverting">Converting...</span>', content)
        content = re.sub(r'<button[^>]*>WAV濡[^<]*?</button>', '<button class="btn btn-outline-primary btn-sm" @click="startConvert(\'wav\')" :disabled="isConverting">Convert to WAV</button>', content)
        content = re.sub(r'<button[^>]*>OGG濡[^<]*?</button>', '<button class="btn btn-outline-primary btn-sm" @click="startConvert(\'ogg\')" :disabled="isConverting">Convert to OGG</button>', content)
        content = re.sub(r'<button[^>]*>Another File 蹂[^<]*?</button>', '<button class="btn btn-secondary btn-lg w-100 mt-2" @click="reset()">Convert Another File</button>', content)
        
        # Messages
        content = re.sub(r'<p[^>]*>[^<]*?蹂[^<]*?以[^<]*?좉퉸留[^<]*?</p>', '<p style="text-align: center; color: #666;">Converting... Please wait a moment.</p>', content)
        content = re.sub(r'<strong>[^<]*?蹂[^<]*?꾨즺[^<]*?</strong>', '<strong>Conversion Complete!</strong>', content)
        
        # Quality options
        content = re.sub(r'<option[^>]*>320 kbps \(理쒓퀬[^)]*\)</option>', '<option value="320">320 kbps (Highest Quality)</option>', content)
        content = re.sub(r'<label[^>]*>鍮꾨뵒[^:]*?:</label>', '<label for="quality" class="form-label">Video Quality:</label>', content)
        content = re.sub(r'<option[^>]*>[^<]*?믪[^<]*?덉쭏[^<]*?</option>', '<option value="high">🎬 High Quality (1920x1080, 8000kbps)</option>', content)
        content = re.sub(r'<option[^>]*>[^<]*?벟[^<]*?쒖[^<]*?덉쭏[^<]*?</option>', '<option value="medium" selected>📺 Medium Quality (1280x720, 5000kbps)</option>', content)
        content = re.sub(r'<option[^>]*>[^<]*?덉쭏[^<]*?</option>', '<option value="low">📱 Low Quality (854x480, 2500kbps)</option>', content)
        content = re.sub(r'<span[^>]*>[^<]*?뺤텞[^<]*?</span>', '<span x-show="!isConverting">🎬 Compress Video</span>', content)
        
        # Features section - remove all corrupted Korean
        content = re.sub(r'<p>怨좎냽 FFmpeg[^<]*?</p>', '<p>Lightning-fast conversion using FFmpeg engine</p>', content)
        content = re.sub(r'<h4>[^<]*?럻截[^<]*?덉쭏 議곗젅</h4>', '<h4>🎚️ Quality Control</h4>', content)
        content = re.sub(r'<h4>📊 ?덉쭏 議곗젅</h4>', '<h4>🎚️ Quality Control</h4>', content)
        content = re.sub(r'<p>[^<]*?먰븯[^<]*?댁긽[^<]*?</p>', '<p>Adjust quality by selecting bitrate</p>', content)
        content = re.sub(r'<p>紐⑤뱺[^<]*?뚯씪[^<]*?10遺[^<]*?</p>', '<p>All files are automatically deleted after 10 minutes</p>', content)
        
        # Tab labels
        content = re.sub(r'>Office ❌PDF<', '>Office to PDF<', content)
        
        # Converter tool descriptions
        content = re.sub(r'<p[^>]*>Reduce PDF File Size/p>', '<p class="text-muted small">Reduce PDF File Size</p>', content)
        content = re.sub(r'<p[^>]*>Apple Format❌JPG濡[^<]*?</p>', '<p class="text-muted small">Apple Format to JPG</p>', content)
        content = re.sub(r'<p[^>]*>Apple Format❌PNG濡[^<]*?</p>', '<p class="text-muted small">Apple Format to PNG</p>', content)
        content = re.sub(r'<p[^>]*>理쒖떊 Format[^<]*?</p>', '<p class="text-muted small">Optimize to next-gen format</p>', content)
        content = re.sub(r'<p[^>]*>鍮꾨뵒❌File Size 以꾩씠湲[^<]*?</p>', '<p class="text-muted small">Reduce Video File Size</p>', content)
        
        # Fix emoji placeholders
        content = re.sub(r'<div[^>]*>\?렦</div>', '<div style="font-size: 3rem; margin-bottom: 1rem;">🎵</div>', content)
        content = re.sub(r'<div[^>]*>❌/div>', '<div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>', content)
        content = re.sub(r'<div[^>]*>🖼️/div>', '<div style="font-size: 3rem; margin-bottom: 1rem;">🖼️</div>', content)
        content = re.sub(r'<div[^>]*>🗜️/div>', '<div style="font-size: 3rem; margin-bottom: 1rem;">🗜️</div>', content)
        content = re.sub(r'<div[^>]*>🎞️/div>', '<div style="font-size: 3rem; margin-bottom: 1rem;">🎞️</div>', content)
        
        # Fix header icons
        content = re.sub(r'<h1>?렦 WAV Converter</h1>', '<h1>🎵 WAV Converter</h1>', content)
        content = re.sub(r'<h1>?렦 OGG Converter</h1>', '<h1>🎵 OGG Converter</h1>', content)
        content = re.sub(r'<h1>?렦 M4A Converter</h1>', '<h1>🎵 M4A Converter</h1>', content)
        content = re.sub(r'<h1>?렦 AAC Converter</h1>', '<h1>🎵 AAC Converter</h1>', content)
        content = re.sub(r'<h1>?렗 MP4 Converter</h1>', '<h1>🎬 MP4 Converter</h1>', content)
        content = re.sub(r'<h1>?렏 MOV Converter</h1>', '<h1>🎬 MOV Converter</h1>', content)
        content = re.sub(r'<h1>?렗 MKV Converter</h1>', '<h1>🎬 MKV Converter</h1>', content)
        content = re.sub(r'<h1>?벞 WebM Converter</h1>', '<h1>🎬 WebM Converter</h1>', content)
        
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
            if fix_file_comprehensive(filepath):
                fixed_count += 1
        else:
            print(f"⚠️  File not found: {filename}")
    
    print(f"\n🎉 Complete! Fixed {fixed_count} out of {len(files_to_fix)} files.")

if __name__ == '__main__':
    main()
