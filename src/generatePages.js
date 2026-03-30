const fs = require('fs');
const path = require('path');

/**
 * Generate all conversion HTML pages from template + config
 * Called at server startup to ensure pages are always fresh
 */
function generatePages() {
  const templatePath = path.join(__dirname, '../templates/conversion.template.html');
  const configPath = path.join(__dirname, './formats-config.json');
  const outputDir = path.join(__dirname, '../public');

  // Validate template exists
  if (!fs.existsSync(templatePath)) {
    throw new Error(`❌ Template not found: ${templatePath}`);
  }

  // Validate config exists
  if (!fs.existsSync(configPath)) {
    throw new Error(`❌ Config not found: ${configPath}`);
  }

  // Read template
  let template;
  try {
    template = fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(`❌ Failed to read template: ${error.message}`);
  }

  // Read and parse config
  let config;
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(`❌ Failed to parse config JSON: ${error.message}`);
  }

  // Validate config structure
  if (!config.formats || !Array.isArray(config.formats)) {
    throw new Error('❌ Config missing "formats" array');
  }

  if (config.formats.length === 0) {
    throw new Error('❌ Config "formats" array is empty');
  }

  // Generate each page
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  config.formats.forEach((format) => {
    try {
      // Validate required fields
      const requiredFields = [
        'id', 'filename', 'title', 'description', 'keywords',
        'h1', 'subtitle', 'sourceFormat', 'targetFormat',
        'emoji', 'buttonText', 'canonicalUrl', 'ogImage'
      ];

      for (const field of requiredFields) {
        if (!(field in format)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Clone template
      let html = template;

      // Replace all placeholders
      const replacements = {
        '{{id}}': format.id,
        '{{title}}': format.title,
        '{{description}}': format.description,
        '{{keywords}}': format.keywords,
        '{{canonicalUrl}}': format.canonicalUrl,
        '{{ogImage}}': format.ogImage,
        '{{h1}}': format.h1,
        '{{subtitle}}': format.subtitle,
        '{{sourceFormat}}': format.sourceFormat,
        '{{targetFormat}}': format.targetFormat,
        '{{emoji}}': format.emoji,
        '{{buttonText}}': format.buttonText
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        html = html.split(placeholder).join(value);
      }

      // Check for any unmatched placeholders
      const unmatchedPlaceholders = html.match(/{{[^}]+}}/g);
      if (unmatchedPlaceholders) {
        throw new Error(`Unmatched placeholders: ${unmatchedPlaceholders.join(', ')}`);
      }

      // Write file to public directory
      const outputPath = path.join(outputDir, format.filename);
      fs.writeFileSync(outputPath, html, 'utf-8');
      results.success++;

    } catch (error) {
      results.failed++;
      results.errors.push({
        format: format.id,
        filename: format.filename,
        error: error.message
      });
    }
  });

  // Report results
  console.log(`\n📄 Page Generation Summary:`);
  console.log(`   ✅ Generated: ${results.success} files`);
  if (results.failed > 0) {
    console.log(`   ❌ Failed: ${results.failed} files`);
    results.errors.forEach(err => {
      console.log(`      - ${err.filename}: ${err.error}`);
    });
    throw new Error(`Failed to generate ${results.failed} page(s)`);
  }
  console.log('');

  return results;
}

// Export for use in server.js
module.exports = generatePages;

// Allow direct execution: node src/generatePages.js
if (require.main === module) {
  try {
    generatePages();
    process.exit(0);
  } catch (error) {
    console.error('❌ Page generation failed:', error.message);
    process.exit(1);
  }
}
