const fs = require('fs');
const path = require('path');

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
    let originalContent = content;
    let changesCount = 0;

    // Fix all broken closing tags - replace ?/ with </
    const closingTagFixes = [
        ['?/div>', '</div>'],
        ['?/p>', '</p>'],
        ['?/a>', '</a>'],
        ['?/span>', '</span>'],
        ['?/button>', '</button>'],
        ['?/h1>', '</h1>'],
        ['?/h2>', '</h2>'],
        ['?/h3>', '</h3>'],
        ['?/h4>', '</h4>'],
        ['?/h5>', '</h5>'],
        ['?/h6>', '</h6>'],
        ['?/li>', '</li>'],
        ['?/ul>', '</ul>'],
        ['?/ol>', '</ol>'],
        ['?/section>', '</section>'],
        ['?/article>', '</article>'],
        ['?/header>', '</header>'],
        ['?/footer>', '</footer>'],
        ['?/nav>', '</nav>'],
        ['?/form>', '</form>'],
        ['?/table>', '</table>'],
        ['?/tr>', '</tr>'],
        ['?/td>', '</td>'],
        ['?/th>', '</th>'],
    ];

    closingTagFixes.forEach(([broken, fixed]) => {
        const regex = new RegExp(broken.replace(/[?]/g, '\\?').replace(/\//g, '\\/'), 'g');
        const newContent = content.replace(regex, fixed);
        if (newContent !== content) {
            changesCount++;
            console.log(`  ✓ Fixed: ${broken} → ${fixed}`);
        }
        content = newContent;
    });

    // Fix broken Korean patterns (full broken unicode pattern)
    const patterns = [
        ['?귨툘?뵕?뱞?뱤?벑?뼹截', ''],
        ['?귨툘', ''],
        // Fix "Latest/Modern Format" corruption variations
        ['理쒖떊 Format 理/p>', 'Modern Format</p>'],
        ['理쒖떊 Format', 'Modern Format'],
        ['理쒖', 'Latest'],
        ['理/p>', '</p>'],
    ];

    patterns.forEach(([broken, fixed]) => {
        if (content.includes(broken)) {
            content = content.split(broken).join(fixed);
            changesCount++;
            console.log(`  ✓ Fixed broken Korean: "${broken}" → "${fixed}"`);
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ File updated successfully (${changesCount} changes)`);
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
