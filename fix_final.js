const fs = require('fs');

const files = [
    'public/mp4.html',
    'public/mov.html',
    'public/mkv.html',
    'public/webm.html',
    'public/video-compress.html',
    'public/video-gif.html'
];

function fixVideoFile(filepath, format) {
    try {
        let content = fs.readFileSync(filepath, 'utf8');
        let changed = false;

        // Line 116 type patterns - convert button
        const buttonPatterns = [
            { from: `🎬 ${format} 蹂❌`, to: `🎬 Convert to ${format}` },
            { from: `🎬  蹂❌`, to: `🎬 Compress Video` },
            { from: `🎬 GIF 蹂❌`, to: `🎬 Convert to GIF` }
        ];

        buttonPatterns.forEach(({ from, to }) => {
            if (content.includes(from)) {
                content = content.split(from).join(to);
                changed = true;
                console.log(`  ✓ Fixed button: "${from}" → "${to}"`);
            }
        });

        // Line 123 type - converting message
        const convertingPatterns = [
            '蹂❌以?.. 留?湲곕떎＜.',
            '蹂❌以?.. 留?湲곕떎＜'
        ];

        convertingPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                content = content.split(pattern).join('Converting... Please wait a moment.');
                changed = true;
                console.log(`  ✓ Fixed converting message`);
            }
        });

        // Line 139 type - another file button
        if (content.includes('Another File 蹂❌')) {
            content = content.split('Another File 蹂❌').join('Convert Another File');
            changed = true;
            console.log(`  ✓ Fixed another file button`);
        }

        // Line 521/507 type - security message
        const securityPatterns = [
            '紐⑤뱺 ? 10遺❌ ❌⑸',
            '紐⑤뱺 ? 10遺❌ ❌⑸/p>'
        ];

        securityPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                content = content.split(pattern).join('All files are automatically deleted after 10 minutes');
                changed = true;
                console.log(`  ✓ Fixed security message`);
            }
        });

        if (changed) {
            fs.writeFileSync(filepath, content, 'utf8');
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

console.log('🔧 Final fix using string split/join...\n');

const formats = {
    'public/mp4.html': 'MP4',
    'public/mov.html': 'MOV',
    'public/mkv.html': 'MKV',
    'public/webm.html': 'WebM',
    'public/video-compress.html': 'Compress',
    'public/video-gif.html': 'GIF'
};

let fixed = 0;
Object.entries(formats).forEach(([file, format]) => {
    if (fs.existsSync(file)) {
        console.log(`\n📝 ${file}:`);
        if (fixVideoFile(file, format)) {
            fixed++;
            console.log(`  ✅ Saved`);
        } else {
            console.log(`  ⏭️  No changes needed`);
        }
    }
});

console.log(`\n\n✨ Fixed ${fixed} out of ${files.length} files!`);
