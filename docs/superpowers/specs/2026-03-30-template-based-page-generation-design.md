# Template-Based Static Page Generation Design

**Date:** 2026-03-30
**Problem:** 50+ nearly identical HTML conversion pages are difficult to maintain and update
**Solution:** Single reusable template + JSON config + automatic generation script

---

## 1. Overview

Convert all 50 repetitive conversion page files into a single template-driven system:
- One `conversion.template.html` file with placeholders
- One `formats-config.json` defining metadata for all formats
- One `generatePages.js` script that generates all pages at server startup
- Changes to template/config regenerate all pages automatically

**Benefits:**
- Single source of truth for layout and structure
- Maintain 50 pages by editing 1 template
- SEO preserved: each format retains its own URL
- Easy to add new formats (just add JSON entry)
- Zero impact on existing conversion logic

---

## 2. Architecture

### Directory Structure

```
convert_own/
├── src/
│   ├── generatePages.js                    # ← NEW: Generation entry point
│   └── formats-config.json                 # ← NEW: Format metadata
├── templates/
│   └── conversion.template.html            # ← NEW: Reusable template
├── public/
│   ├── word.html                           # Generated (replaces existing)
│   ├── excel.html                          # Generated
│   ├── ppt.html                            # Generated
│   ├── jpg.html                            # Generated
│   ├── ... (44 more conversion pages)      # Generated
│   ├── index.html                          # Manual (landing page - unchanged)
│   ├── admin.html                          # Manual (unchanged)
│   ├── script.js                           # Unchanged
│   ├── styles.css                          # Unchanged
│   └── (other static files)
├── server.js                               # Minor: add page generation at startup
└── package.json                            # Unchanged
```

### Existing Files That Stay Manual
- `public/index.html` — landing page with format links
- `public/admin.html` — admin dashboard
- `public/blog/*` — blog pages
- `public/404.html` — error page
- Everything in `routes/`, `config/`, `utils/`, `__tests__/` — unchanged

---

## 3. Components

### 3.1 Template File (`templates/conversion.template.html`)

**Purpose:** Single source of truth for all conversion page structure.

**Content:** Current `word.html` refactored with placeholders:
- `{{id}}` — format identifier (word, excel, jpg-to-png, etc.)
- `{{title}}`, `{{description}}`, `{{keywords}}` — SEO metadata
- `{{canonicalUrl}}`, `{{ogImage}}` — OG/canonical tags
- `{{h1}}`, `{{subtitle}}` — page heading text
- `{{sourceFormat}}`, `{{targetFormat}}` — format names (PDF, Word, Excel, etc.)
- `{{emoji}}` — page icon
- `{{buttonText}}` — CTA button text

**Structure:**
1. Head section (SEO, canonical, OG tags)
2. Navbar (shared)
3. Hero section (h1 + subtitle)
4. Upload box with Alpine.js states
5. Footer (shared)
6. Script includes (shared)

**Static content:** navbar, footer, upload states, error handling, script references

---

### 3.2 Configuration File (`formats-config.json`)

**Purpose:** Centralized metadata for all 50 conversion formats.

**Structure:** Array of format objects with fields:
```json
{
  "formats": [
    {
      "id": "word",
      "sourceFormat": "PDF",
      "targetFormat": "Word",
      "fileExtension": "docx",
      "filename": "word.html",
      "title": "PDF to Word Converter - Free & High Quality | Convert4U",
      "description": "Easily convert PDF to editable Word files...",
      "keywords": "PDF to Word, convert PDF to DOCX, ...",
      "h1": "PDF to Word Converter",
      "subtitle": "Convert your PDF documents to editable Microsoft Word files instantly",
      "buttonText": "⚡ Convert to Word",
      "emoji": "📄",
      "canonicalUrl": "https://convert4u.keero.site/word.html",
      "ogImage": "https://convert4u.keero.site/og-image.png"
    },
    // ... 49 more formats
  ]
}
```

**Data to include for all 50 formats:**
- PDF exports: word, excel, ppt, jpg, png (5)
- Office to PDF: word2pdf, excel2pdf, ppt2pdf (3)
- Image conversions: jpg-to-png, png-to-jpg, jpg-to-webp, png-to-webp, webp-to-jpg, webp-to-png, heic-to-jpg, heic-to-png, heic-to-webp (9)
- Image tools: resize, compress-image (2)
- Audio: mp3, wav, ogg, m4a, aac (5)
- Video: mp4, mov, webm, mkv (4)
- Video tools: compress-video, gif (2)
- PDF tools: merge, split, compress (3)
- Other: (9 more - must extract from current HTML files)

**Maintenance:** Edit this file to update metadata, titles, descriptions. No code changes needed.

---

### 3.3 Generation Script (`src/generatePages.js`)

**Purpose:** Read template + config, generate all HTML files.

**Algorithm:**
1. Read `templates/conversion.template.html`
2. Read `formats-config.json`
3. For each format object:
   - Clone template
   - Replace all `{{placeholder}}` with format-specific values
   - Write to `public/{filename}`
4. Log results

**Input:** Template file, config file
**Output:** 50 HTML files in `public/`
**Idempotent:** Safe to run multiple times, overwrites existing files

**Error handling:**
- If template not found: fail loudly (exit 1)
- If config JSON invalid: fail loudly (exit 1)
- If write to public/ fails: fail loudly with specific file path

---

### 3.4 Server Integration (`server.js`)

**Change:** Call `generatePages()` at startup, before Express starts.

```javascript
const generatePages = require('./src/generatePages');

try {
  generatePages();
  console.log('✅ Pages generated successfully');
} catch (error) {
  console.error('❌ Page generation failed:', error);
  process.exit(1);
}

// Continue with Express setup...
app.use(express.static('public'));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Behavior:**
- **On startup:** All 50 pages regenerate (idempotent)
- **On error:** Server refuses to start (fail-safe)
- **Performance:** Generation takes <100ms (negligible)

---

## 4. Data Flow

```
┌─────────────────────────────────┐
│ formats-config.json             │
│ (50 format definitions)         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ generatePages.js                │
│ (reads config, reads template)  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ conversion.template.html        │
│ (placeholders: {{id}}, etc.)    │
└──────────────┬──────────────────┘
               │
    (for each format in config)
               │
    Replace {{placeholders}} with
    format-specific values
               │
               ▼
┌─────────────────────────────────┐
│ public/word.html                │
│ public/excel.html               │
│ public/jpg.html                 │
│ ... (50 total)                  │
└─────────────────────────────────┘
```

---

## 5. Maintenance Workflows

### 5.1 Update Template (Layout/Structure)
1. Edit `templates/conversion.template.html`
2. Server restarts automatically (dev) or redeploy (prod)
3. All 50 pages regenerate with new layout
4. **Cost:** 1 file edited, automatic regeneration

### 5.2 Update SEO for One Format
1. Edit `formats-config.json` → find format entry → update `title`, `description`, `keywords`
2. Regenerate or redeploy
3. That page updates with new metadata
4. **Cost:** Edit 1 JSON object, automatic regeneration

### 5.3 Update Navbar/Footer
1. Edit navbar/footer HTML in template
2. Regenerate
3. All 50 pages get the update
4. **Cost:** 1 location, automatic regeneration

### 5.4 Add New Format (e.g., TIFF support)
1. Add new object to `formats` array in config
2. Regenerate
3. New `public/tiff.html` is created
4. Update `public/index.html` to link to it
5. **Cost:** Add 1 JSON object + 1 line in landing page

---

## 6. Implementation Details

### 6.1 Template Placeholder Strategy
Use `{{name}}` syntax for clarity and to avoid accidental replacements.

All placeholders used:
- `{{id}}` — format ID
- `{{title}}` — page title (for <title> and OG:title)
- `{{description}}` — meta description and OG:description
- `{{keywords}}` — meta keywords
- `{{canonicalUrl}}` — rel=canonical and OG:url
- `{{ogImage}}` — OG:image
- `{{h1}}` — main heading
- `{{subtitle}}` — subheading
- `{{sourceFormat}}` — source format name (PDF, JPEG, etc.)
- `{{targetFormat}}` — target format name (Word, PNG, etc.)
- `{{emoji}}` — page icon
- `{{buttonText}}` — CTA button text

### 6.2 Config File Validation
No runtime validation needed (configs are static). If a format object is missing required fields, generation will produce invalid placeholders visible in the HTML, which is immediately caught in testing.

### 6.3 File Generation Safety
- Overwrites existing files (idempotent, safe for regeneration)
- Creates files in `public/` only
- Does not delete or move files
- Reversible: commit `formats-config.json` and `templates/` to git, regenerate anytime

---

## 7. Testing Strategy

### Unit Tests (generatePages.js)
- Verify script reads template and config
- Verify placeholders are replaced correctly
- Verify output files are created
- Verify error handling (missing template, invalid JSON)

### Integration Tests
- Verify generated HTML is valid (no unmatched placeholders)
- Verify each generated page loads without errors
- Verify SEO metadata is correct (title, description, canonical, OG tags)
- Verify Alpine.js store binds correctly (format variable in x-data)

### Regression Tests
- Compare generated page structure to original `word.html`
- Ensure upload functionality unchanged
- Ensure conversion API calls unchanged

---

## 8. Deployment

### Development
```bash
npm run dev  # Auto-restarts server, regenerates pages on each startup
```

### Production
Add to `package.json` scripts:
```json
"scripts": {
  "generate": "node src/generatePages.js",
  "build": "npm run generate",
  "start": "node server.js"
}
```

Deployment flow:
```bash
npm ci
npm run build          # Generate all 50 pages
npm start              # Start server (regenerates again as safety)
```

Or in Docker:
```dockerfile
COPY . .
RUN npm run generate
EXPOSE 3002
CMD ["npm", "start"]
```

---

## 9. Migration Path

### Phase 1: Setup
- Create `src/generatePages.js`
- Create `templates/conversion.template.html` (copy from `word.html`)
- Create `formats-config.json` (extract metadata from all 50 existing files)

### Phase 2: Integration
- Add generation call to `server.js` startup
- Test that generated `word.html` matches original `word.html`

### Phase 3: Rollout
- Regenerate all 50 files
- Delete old files (they're now obsolete)
- Commit to git: `generatePages.js`, `formats-config.json`, `templates/`

### Phase 4: Verify
- All pages still load correctly
- SEO metadata intact
- Conversion functionality unchanged
- Upload/download works as before

---

## 10. Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Generation script fails → server won't start | Error handling in script; fast detection |
| Placeholder not replaced → invalid HTML | Visual inspection of generated files; test suite |
| Config file syntax error → broken pages | Validate JSON at generation time |
| Accidentally delete template → can't regenerate | Git version control; backup in git history |

---

## 11. Success Criteria

✅ All 50 conversion pages are generated from one template
✅ SEO metadata (titles, descriptions, canonicals) is correct
✅ Each format has its own URL (e.g., `/word.html`, `/excel.html`)
✅ Updating template changes all 50 pages
✅ Updating config updates metadata without touching template
✅ Server starts with automatic generation
✅ No impact on conversion logic, API calls, or storage
✅ Adding a new format requires only JSON + regeneration

---

## 12. Future Enhancements

- Lazy generation: only regenerate changed formats (caching by config hash)
- Watch mode: auto-regenerate during dev when config/template changes
- Analytics: track which formats are most popular
- Variants: generate mobile-optimized versions as separate files

---

**Status:** Design approved by user. Ready for implementation planning.
