const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
    'public/mp4.html',
    'public/mov.html',
    'public/mkv.html',
    'public/webm.html',
    'public/video-compress.html',
    'public/video-gif.html'
];

// Replacement patterns
const replacements = [
    // Hero section descriptions
    { pattern: /鍮❌MP4 Format 蹂/g, replacement: 'Convert your video files to MP4 format' },
    { pattern: /鍮❌MOV Format 蹂/g, replacement: 'Convert your video files to MOV format' },
    { pattern: /鍮❌MKV Format 蹂/g, replacement: 'Convert your video files to MKV format' },
    { pattern: /鍮❌WebM Format 蹂/g, replacement: 'Convert your video files to WebM format' },

    // Convert buttons
    { pattern: /🎬 MP4 蹂❌/g, replacement: '🎬 Convert to MP4' },
    { pattern: /🎬 MOV 蹂❌/g, replacement: '🎬 Convert to MOV' },
    { pattern: /🎬 MKV 蹂❌/g, replacement: '🎬 Convert to MKV' },
    { pattern: /🎬 WebM 蹂❌/g, replacement: '🎬 Convert to WebM' },
    { pattern: /🎬 GIF 蹂❌/g, replacement: '🎬 Convert to GIF' },
    { pattern: /🎬\s+蹂❌/g, replacement: '🎬 Compress Video' },

    // Converting message
    { pattern: /蹂❌以\?\.\..*?＜\./g, replacement: 'Converting... Please wait a moment.' },

    // Another file button
    { pattern: /Another File 蹂❌/g, replacement: 'Convert Another File' },

    // Features section
    { pattern: /📊\s+議곗젅/g, replacement: '🎚️ Quality Control' },
    { pattern: /❌\?\s*鍮\s*❌/g, replacement: 'Adjust quality by selecting bitrate' },
    { pattern: /紐⑤뱺\s*\?\s*10遺❌\s*❌⑸/g, replacement: 'All files are automatically deleted after 10 minutes' },

    // WebP descriptions
    { pattern: /理쒖떊 Format 理쒖쟻❌/g, replacement: 'Optimize to next-gen format' },
    { pattern: /理쒖떊 Format 理/g, replacement: 'Optimize to next-gen format' },

    // Video compress description
    { pattern: /Reduce Video File Size\/p>/g, replacement: 'Reduce Video File Size</p>' },

    // Navbar toggler
    { pattern: /<span class="navbar-toggler-icon">⚡ Convert<\/span>/g, replacement: '<span class="navbar-toggler-icon"></span>' },

    // Success message
    { pattern: /❌<strong>Conversion Complete!/g, replacement: '✅ <strong>Conversion Complete!' }
];

function fixFile(filepath) {
    try {
        console.log(`\n📝 Processing: ${filepath}`);

        // Read file
        let content = fs.readFileSync(filepath, 'utf8');
        const originalContent = content;

        // Apply all replacements
        let changeCount = 0;
        replacements.forEach(({ pattern, replacement }) => {
            const matches = content.match(pattern);
            if (matches) {
                console.log(`   ✓ Found ${matches.length} instance(s) of pattern`);
                content = content.replace(pattern, replacement);
                changeCount += matches.length;
            }
        });

        // Write back if changes were made
        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`   ✅ Fixed ${changeCount} issues in ${path.basename(filepath)}`);
            return true;
        } else {
            console.log(`   ⏭️  No changes needed`);
            return false;
        }
    } catch (error) {
        console.error(`   ❌ Error processing ${filepath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🚀 Starting video file encoding fix...\n');
    console.log('='.repeat(60));

    let fixedCount = 0;

    files.forEach(file => {
        if (fs.existsSync(file)) {
            if (fixFile(file)) {
                fixedCount++;
            }
        } else {
            console.log(`\n⚠️  File not found: ${file}`);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 Complete! Fixed ${fixedCount} out of ${files.length} files.`);
    console.log('\n✨ All video converter pages should now display correctly!\n');
}

main();
