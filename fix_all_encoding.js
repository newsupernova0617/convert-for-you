const fs = require('fs');
const path = require('path');

// All HTML files in public directory
const publicDir = 'public';
const files = fs.readdirSync(publicDir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(publicDir, f));

// More comprehensive replacement patterns
const replacements = [
    // Remove any remaining corrupted Korean characters (they appear as ? followed by Korean)
    { pattern: /\?[가-힣]+/g, replacement: '' },

    // Specific corrupted patterns
    { pattern: /鍮❌.*?Format.*?蹂/g, replacement: 'Convert your files to the desired format' },
    { pattern: /蹂❌以\?\.\..*?＜\./g, replacement: 'Converting... Please wait a moment.' },
    { pattern: /Another File 蹂❌/g, replacement: 'Convert Another File' },
    { pattern: /紐⑤뱺.*?10遺.*?❌/g, replacement: 'All files are automatically deleted after 10 minutes' },
    { pattern: /理쒖떊.*?Format.*?❌/g, replacement: 'Optimize to next-gen format' },
    { pattern: /議곗젅/g, replacement: 'Quality Control' },
    { pattern: /❌\?.*?鍮.*?❌/g, replacement: 'Adjust quality by selecting bitrate' },

    // Fix specific button patterns
    { pattern: /🎬.*?蹂❌/g, replacement: '🎬 Convert' },
    { pattern: /⚡.*?蹂❌/g, replacement: '⚡ Convert' },

    // Fix closing tags
    { pattern: /Reduce Video File Size\/p>/g, replacement: 'Reduce Video File Size</p>' },
    { pattern: /Apple Format.*?JPG\/p>/g, replacement: 'Apple Format to JPG</p>' },
    { pattern: /Apple Format.*?PNG\/p>/g, replacement: 'Apple Format to PNG</p>' },

    // Navbar toggler
    { pattern: /<span class="navbar-toggler-icon">⚡ Convert<\/span>/g, replacement: '<span class="navbar-toggler-icon"></span>' },

    // Success/Error icons
    { pattern: /❌<strong>Conversion Complete!/g, replacement: '✅ <strong>Conversion Complete!' },
    { pattern: /❌<strong>Error:/g, replacement: '❌ <strong>Error:' }
];

function fixFile(filepath) {
    try {
        // Read file
        let content = fs.readFileSync(filepath, 'utf8');
        const originalContent = content;

        // Apply all replacements
        let changeCount = 0;
        replacements.forEach(({ pattern, replacement }) => {
            const before = content;
            content = content.replace(pattern, replacement);
            if (content !== before) {
                changeCount++;
            }
        });

        // Write back if changes were made
        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Fixed: ${path.basename(filepath)} (${changeCount} patterns)`);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error(`❌ Error: ${filepath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🚀 Final comprehensive encoding fix...\n');

    let fixedCount = 0;
    let totalFiles = 0;

    files.forEach(file => {
        totalFiles++;
        if (fixFile(file)) {
            fixedCount++;
        }
    });

    console.log(`\n🎉 Complete! Fixed ${fixedCount} out of ${totalFiles} files.`);
}

main();
