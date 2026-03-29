#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Batch fix for remaining audio files (m4a, aac) and all video files
"""

import os
import re

def fix_audio_file(filepath, format_name):
    """Fix encoding issues in audio converter files"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix bitrate options - remove video option, add 320 kbps
        content = re.sub(
            r'<option value="low">📱 Low Quality \(854x480, 2500kbps\)</option>',
            '<option value="320">320 kbps (Highest Quality)</option>',
            content
        )
        
        # Fix main convert button
        content = re.sub(
            r'<span x-show="!isConverting"> MP3濡\?蹂❌</span>',
            f'<span x-show="!isConverting">⚡ Convert to {format_name}</span>',
            content
        )
        
        # Fix secondary buttons
        content = re.sub(r'WAV濡\?蹂❌', 'Convert to WAV', content)
        content = re.sub(r'OGG濡\?蹂❌', 'Convert to OGG', content)
        content = re.sub(r'MP3濡\?蹂❌', 'Convert to MP3', content)
        
        # Fix converting message
        content = re.sub(r'蹂❌以\?\.\..*?＜\.', 'Converting... Please wait a moment.', content)
        
        # Fix "Another File" button
        content = re.sub(r'Another File 蹂❌', 'Convert Another File', content)
        
        # Fix tab labels
        content = re.sub(r'Office ❌PDF', 'Office to PDF', content)
        
        # Fix converter descriptions
        content = re.sub(r'Apple Format❌JPG濡\?', 'Apple Format to JPG', content)
        content = re.sub(r'Apple Format❌PNG濡\?', 'Apple Format to PNG', content)
        content = re.sub(r'理쒖떊 Format.*?❌', 'Optimize to next-gen format', content)
        content = re.sub(r'鍮꾨뵒❌File Size 以꾩씠湲\?', 'Reduce Video File Size', content)
        
        # Fix features section
        content = re.sub(r'紐⑤뱺.*?10遺❌.*?❌젣.*?❌', 'All files are automatically deleted after 10 minutes', content)
        
        # Fix convert button action for the specific format
        if format_name == 'M4A':
            content = re.sub(
                r'<button class="btn btn-primary btn-lg" @click="startConvert\(\'mp3\'\)"',
                '<button class="btn btn-primary btn-lg" @click="startConvert(\'m4a\')"',
                content
            )
        elif format_name == 'AAC':
            content = re.sub(
                r'<button class="btn btn-primary btn-lg" @click="startConvert\(\'mp3\'\)"',
                '<button class="btn btn-primary btn-lg" @click="startConvert(\'aac\')"',
                content
            )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {os.path.basename(filepath)}")
            return True
        else:
            print(f"⏭️  No changes: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"❌ Error: {filepath}: {e}")
        return False

def fix_video_file(filepath, format_name):
    """Fix encoding issues in video converter files"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix upload instruction for video files
        content = re.sub(
            r'<strong>\?ш린❌.*?❌/strong>',
            '<strong>Drag and drop your video file or click to upload</strong>',
            content
        )
        
        # Fix video quality labels
        content = re.sub(r'鍮꾨뵒❌.*?:', 'Video Quality:', content)
        content = re.sub(r'.*?믪.*?덉쭏.*?\(1920x1080', '🎬 High Quality (1920x1080', content)
        content = re.sub(r'.*?벟.*?쒖.*?덉쭏.*?\(1280x720', '📺 Medium Quality (1280x720', content)
        content = re.sub(r'📱.*?덉쭏.*?\(854x480', '📱 Low Quality (854x480', content)
        
        # Fix convert buttons
        content = re.sub(r'뺤텞.*?蹂❌', 'Compress Video', content)
        content = re.sub(r'MP4濡\?蹂❌', 'Convert to MP4', content)
        content = re.sub(r'MOV濡\?蹂❌', 'Convert to MOV', content)
        content = re.sub(r'MKV濡\?蹂❌', 'Convert to MKV', content)
        content = re.sub(r'WebM濡\?蹂❌', 'Convert to WebM', content)
        content = re.sub(r'GIF濡\?蹂❌', 'Convert to GIF', content)
        
        # Fix converting message
        content = re.sub(r'蹂❌以\?\.\..*?＜\.', 'Converting... Please wait a moment.', content)
        
        # Fix "Another File" button
        content = re.sub(r'Another File 蹂❌', 'Convert Another File', content)
        
        # Fix tab labels
        content = re.sub(r'Office ❌PDF', 'Office to PDF', content)
        
        # Fix converter descriptions
        content = re.sub(r'Apple Format❌JPG濡\?', 'Apple Format to JPG', content)
        content = re.sub(r'Apple Format❌PNG濡\?', 'Apple Format to PNG', content)
        content = re.sub(r'理쒖떊 Format.*?❌', 'Optimize to next-gen format', content)
        content = re.sub(r'鍮꾨뵒❌File Size 以꾩씠湲\?', 'Reduce Video File Size', content)
        
        # Fix features section
        content = re.sub(r'紐⑤뱺.*?10遺❌.*?❌젣.*?❌', 'All files are automatically deleted after 10 minutes', content)
        content = re.sub(r'.*?먰븯❌.*?댁긽.*?', 'Adjust quality by selecting bitrate', content)
        content = re.sub(r'📊.*?덉쭏 議곗젅', '🎚️ Quality Control', content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {os.path.basename(filepath)}")
            return True
        else:
            print(f"⏭️  No changes: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"❌ Error: {filepath}: {e}")
        return False

def main():
    public_dir = 'public'
    
    # Audio files
    audio_files = [
        ('m4a.html', 'M4A'),
        ('aac.html', 'AAC'),
    ]
    
    # Video files
    video_files = [
        ('mp4.html', 'MP4'),
        ('mov.html', 'MOV'),
        ('mkv.html', 'MKV'),
        ('webm.html', 'WebM'),
        ('video-compress.html', 'Compress'),
        ('video-gif.html', 'GIF'),
    ]
    
    print("🎵 Fixing audio files...")
    for filename, format_name in audio_files:
        filepath = os.path.join(public_dir, filename)
        if os.path.exists(filepath):
            fix_audio_file(filepath, format_name)
    
    print("\n🎬 Fixing video files...")
    for filename, format_name in video_files:
        filepath = os.path.join(public_dir, filename)
        if os.path.exists(filepath):
            fix_video_file(filepath, format_name)
    
    print("\n🎉 Batch fix complete!")

if __name__ == '__main__':
    main()
