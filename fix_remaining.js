const fs = require('fs');
const path = require('path');

const files = [
    'public/mp4.html',
    'public/mov.html',
    'public/mkv.html',
    'public/webm.html',
    'public/video-compress.html',
    'public/video-gif.html',
    'public/aac.html',
    'public/m4a.html'
];

function fixFile(filepath) {
    try {
        let content = fs.readFileSync(filepath, 'utf8');
        const original = content;

        // Fix specific patterns found in grep
        content = content.replace(/🎬 MP4 蹂❌/g, '🎬 Convert to MP4');
        content = content.replace(/🎬 MOV 蹂❌/g, '🎬 Convert to MOV');
        content = content.replace(/🎬 MKV 蹂❌/g, '🎬 Convert to MKV');
        content = content.replace(/🎬 WebM 蹂❌/g, '🎬 Convert to WebM');
        content = content.replace(/🎬 GIF 蹂❌/g, '🎬 Convert to GIF');
        content = content.replace(/🎬\s+蹂❌/g, '🎬 Compress Video');

        // Fix converting message - exact pattern from grep
        content = content.replace(/蹂❌以\?\.\..*?＜\./g, 'Converting... Please wait a moment.');

        // Fix "Another File" button
        content = content.replace(/Another File 蹂❌/g, 'Convert Another File');

        // Fix security message - exact pattern from grep
        content = content.replace(/紐⑤뱺 \? 10遺❌ ❌⑸/g, 'All files are automatically deleted after 10 minutes');

        // Fix error message icon (should stay as ❌)
        // content already has correct ❌ for error, no change needed

        if (content !== original) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Fixed: ${path.basename(filepath)}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error: ${filepath}:`, error.message);
        return false;
    }
}

console.log('🔧 Fixing remaining encoding issues...\n');

let fixed = 0;
files.forEach(file => {
    if (fs.existsSync(file) && fixFile(file)) {
        fixed++;
    }
});

console.log(`\n✨ Fixed ${fixed} files!`);
