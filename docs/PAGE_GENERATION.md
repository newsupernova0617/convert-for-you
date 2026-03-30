# Page Generation System

## Overview

All 31 conversion HTML pages are generated from a single template + JSON config at server startup.

## Files

- `templates/conversion.template.html` — Reusable template with `{{placeholder}}` variables
- `src/formats-config.json` — Format metadata for all 31 conversions
- `src/generatePages.js` — Generation script (called automatically at startup)
- `server.js` — Calls `generatePages()` before Express listens on port

## How It Works

1. **Server starts** → calls `generatePages()`
2. **Script reads** → `templates/conversion.template.html` + `src/formats-config.json`
3. **For each format** → replace `{{placeholder}}` with format-specific values
4. **Write files** → output to `public/{formatId}.html`
5. **Server listens** → on port 3002 (or configured port)

## Page List

### PDF Exports (5)
- `word.html` — PDF → Word
- `excel.html` — PDF → Excel
- `ppt.html` — PDF → PowerPoint
- `jpg.html` — PDF → JPG images
- `png.html` — PDF → PNG images

### Office to PDF (3)
- `word2pdf.html` — Word → PDF
- `excel2pdf.html` — Excel → PDF
- `ppt2pdf.html` — PowerPoint → PDF

### Image Conversions (9)
- `jpg-to-png.html`, `png-to-jpg.html`
- `jpg-to-webp.html`, `png-to-webp.html`, `webp-to-jpg.html`, `webp-to-png.html`
- `heic-to-jpg.html`, `heic-to-png.html`, `heic-to-webp.html`

### Image Tools (2)
- `image-resize.html` — Image resizer
- `compress-image.html` — Image compressor

### Audio (5)
- `mp3.html`, `wav.html`, `ogg.html`, `m4a.html`, `aac.html`

### Video (4)
- `mp4.html`, `mov.html`, `webm.html`, `mkv.html`

### Video Tools (2)
- `video-compress.html` — Video compressor
- `video-gif.html` — Video to GIF

### PDF Tools (3)
- `merge-pdf.html` — Merge PDFs
- `split-pdf.html` — Split PDF
- `compress-pdf.html` — Compress PDF

**Total: 31 pages**

## Adding a New Format

1. Open `src/formats-config.json`
2. Add a new object to the `formats` array:

```json
{
  "id": "format-id",
  "sourceFormat": "Source Format",
  "targetFormat": "Target Format",
  "filename": "format-id.html",
  "title": "Format ID Converter - Free Online | Convert4U",
  "description": "Short description of conversion.",
  "keywords": "keyword1, keyword2, keyword3",
  "h1": "Format ID Converter",
  "subtitle": "Descriptive subtitle",
  "buttonText": "⚡ Convert to Format ID",
  "emoji": "🎨",
  "canonicalUrl": "https://convert4u.keero.site/format-id.html",
  "ogImage": "https://convert4u.keero.site/og-image.png"
}
```

3. Save and restart server (or run `npm run generate`)
4. New page is automatically generated!

## Updating Template

If you change the layout, structure, or any shared HTML in `templates/conversion.template.html`:

1. Edit the template
2. Restart server (or run `npm run generate`)
3. All 31 pages are regenerated with the new template

## Updating Metadata

If you update a format's SEO metadata in `src/formats-config.json`:

1. Edit the format object (title, description, keywords, etc.)
2. Restart server (or run `npm run generate`)
3. That page is regenerated with new metadata

## npm Scripts

```bash
npm run generate    # Generate all pages from template + config
npm run build       # Alias for generate (useful in CI/CD)
npm start          # Start server (automatically generates pages)
npm run dev        # Start with auto-reload (nodemon)
```

## Error Handling

If generation fails:
- **Missing template**: Server won't start. Check `templates/conversion.template.html` exists.
- **Invalid JSON in config**: Server won't start. Check `src/formats-config.json` syntax.
- **Missing required fields**: Server won't start. Check all format objects have required fields.
- **Unmatched placeholders**: Server won't start. Check template has matching `{{variable}}` names.

## Testing

```bash
npm test -- __tests__/generatePages.test.js   # Run generation tests
npm test                                       # Run all tests
```

## Performance

- Generation: <100ms for 31 pages
- No impact on runtime performance (happens once at startup)
- All pages are static files (no server-side rendering overhead)

## Files to Avoid Manually Editing

Do NOT edit these files directly (they're generated):
- `public/word.html`
- `public/excel.html`
- `public/mp3.html`
- ... (any other conversion page)

They will be overwritten on each restart. Edit the template or config instead!

## History

- **2026-03-30**: System implemented
- **Before**: 31 individual HTML files (maintenance nightmare)
- **Now**: 1 template + 1 config file (single source of truth)
