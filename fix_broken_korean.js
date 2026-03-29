const fs = require('fs');
const path = require('path');

// Define replacements for broken Korean text to English
const replacements = [
    // Fix broken closing tags - specific patterns first
    {
        pattern: /\?\/div>/g,
        replacement: '</div>'
    },
    {
        pattern: /\?\/p>/g,
        replacement: '</p>'
    },
    {
        pattern: /\?\/a>/g,
        replacement: '</a>'
    },
    {
        pattern: /\?\/span>/g,
        replacement: '</span>'
    },
    {
        pattern: /\?\/button>/g,
        replacement: '</button>'
    },
    {
        pattern: /\?\/h[1-6]>/g,
        replacement: (match) => '</' + match.substring(1)
    },
    // Broken closing div tags with full pattern
    {
        pattern: /\?귨툘\?뵕\?뱞\?뱤\?벑\?뼹截\<\/div\>/g,
        replacement: '</div>'
    },
    // Broken text in various locations (just clean up the broken characters)
    {
        pattern: /\?귨툘\?뵕\?뱞\?뱤\?벑\?뼹截/g,
        replacement: ''
    },
    // "Latest Format" in Korean (broken)
    {
        pattern: /理쒖떊 Format 理/g,
        replacement: 'Modern Format'
    },
    // Any other broken Korean patterns
    {
        pattern: /[?]귨툘/g,
        replacement: ''
    },
    {
        pattern: /理쒖/g,
        replacement: 'Latest'
    }
];

// Get all HTML files in the public directory
function getAllHtmlFiles(dir) {
    const files = [];

    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (item.endsWith('.html')) {
                files.push(fullPath);
            }
        }
    }

    traverse(dir);
    return files;
}

// Fix broken Korean text in a file
function fixFile(filePath) {
    console.log(`\nProcessing: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Apply all replacements
    for (const { pattern, replacement } of replacements) {
        const beforeLength = content.length;
        content = content.replace(pattern, replacement);
        if (content.length !== beforeLength) {
            changed = true;
            console.log(`  ✓ Applied replacement: ${pattern} -> "${replacement}"`);
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ File updated successfully`);
        return true;
    } else {
        console.log(`  ℹ️  No broken Korean text found`);
        return false;
    }
}

// Main execution
const publicDir = path.join(__dirname, 'public');
console.log('🔍 Searching for HTML files with broken Korean text...\n');
console.log(`Public directory: ${publicDir}\n`);

const htmlFiles = getAllHtmlFiles(publicDir);
console.log(`Found ${htmlFiles.length} HTML files\n`);

let fixedCount = 0;

for (const file of htmlFiles) {
    if (fixFile(file)) {
        fixedCount++;
    }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Complete! Fixed ${fixedCount} out of ${htmlFiles.length} files`);
console.log('='.repeat(60));
