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

    // Fix all broken closing tags - replace ?/ with </
    content = content.replace(/\?\/div>/g, '</div>');
    content = content.replace(/\?\/p>/g, '</p>');
    content = content.replace(/\?\/a>/g, '</a>');
    content = content.replace(/\?\/span>/g, '</span>');
    content = content.replace(/\?\/button>/g, '</button>');
    content = content.replace(/\?\/h1>/g, '</h1>');
    content = content.replace(/\?\/h2>/g, '</h2>');
    content = content.replace(/\?\/h3>/g, '</h3>');
    content = content.replace(/\?\/h4>/g, '</h4>');
    content = content.replace(/\?\/h5>/g, '</h5>');
    content = content.replace(/\?\/h6>/g, '</h6>');
    content = content.replace(/\?\/li>/g, '</li>');
    content = content.replace(/\?\/ul>/g, '</ul>');
    content = content.replace(/\?\/ol>/g, '</ol>');
    content = content.replace(/\?\/section>/g, '</section>');
    content = content.replace(/\?\/article>/g, '</article>');
    content = content.replace(/\?\/header>/g, '</header>');
    content = content.replace(/\?\/footer>/g, '</footer>');
    content = content.replace(/\?\/nav>/g, '</nav>');
    content = content.replace(/\?\/form>/g, '</form>');
    content = content.replace(/\?\/table>/g, '</table>');
    content = content.replace(/\?\/tr>/g, '</tr>');
    content = content.replace(/\?\/td>/g, '</td>');
    content = content.replace(/\?\/th>/g, '</th>');

    // Fix broken Korean patterns (full broken unicode pattern)
    content = content.replace(/\?귨툘\?뵕\?뱞\?뱤\?벑\?뼹截/g, '');

    // Fix "Latest Format" corruption  
    content = content.replace(/理쒖떊 Format 理/g, 'Modern Format');

    // Fix any remaining broken patterns
    content = content.replace(/\?귨툘/g, '');
    content = content.replace(/理쒖/g, 'Latest');

    if (content !== originalContent) {
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
