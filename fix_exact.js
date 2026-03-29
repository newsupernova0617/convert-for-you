const fs = require('fs');

const files = {
    'public/mp4.html': { format: 'MP4', hero: 'Convert your video files to MP4 format' },
    'public/mov.html': { format: 'MOV', hero: 'Convert your video files to MOV format' },
    'public/mkv.html': { format: 'MKV', hero: 'Convert your video files to MKV format' },
    'public/webm.html': { format: 'WebM', hero: 'Convert your video files to WebM format' },
    'public/video-compress.html': { format: 'Compress', hero: 'Reduce your video file size' },
    'public/video-gif.html': { format: 'GIF', hero: 'Convert your video to animated GIF' }
};

function fixFile(filepath, config) {
    try {
        let content = fs.readFileSync(filepath, 'utf8');
        const original = content;

        // Fix convert button - exact string from JSON output
        if (config.format === 'Compress') {
            content = content.replace('🎬  蹂❌', '🎬 Compress Video');
        } else if (config.format === 'GIF') {
            content = content.replace('🎬 GIF 蹂❌', '🎬 Convert to GIF');
        } else {
            content = content.replace(`🎬 ${config.format} 蹂❌`, `🎬 Convert to ${config.format}`);
        }

        // Fix converting message
        content = content.replace('蹂❌以?.. 留?湲곕떎＜.', 'Converting... Please wait a moment.');

        // Fix another file button
        content = content.replace('Another File 蹂❌', 'Convert Another File');

        // Fix security message  
        content = content.replace('紐⑤뱺 ? 10遺❌ ❌⑸', 'All files are automatically deleted after 10 minutes');

        if (content !== original) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Fixed: ${filepath}`);
            return true;
        } else {
            console.log(`⏭️  No changes: ${filepath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error ${filepath}:`, error.message);
        return false;
    }
}

console.log('🔧 Fixing video files with exact strings...\n');

let fixed = 0;
Object.entries(files).forEach(([file, config]) => {
    if (fs.existsSync(file) && fixFile(file, config)) {
        fixed++;
    }
});

console.log(`\n✨ Complete! Fixed ${fixed} files.`);
