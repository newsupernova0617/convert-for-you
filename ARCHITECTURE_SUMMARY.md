# PDF Converter - Quick Architecture Reference

## At a Glance

**Type**: Full-stack Node.js web application  
**Purpose**: Convert PDFs to Word, Excel, PowerPoint, JPG, PNG  
**Deployment**: Single Node.js server + Cloudflare R2 storage  
**Users**: Zero (file-based, public web app)

---

## Key System Components

### 1. Frontend (Pure Client-Side)
- **Files**: 6 HTML pages + 1 JS file + 1 CSS file
- **Framework**: Bootstrap 5 + Alpine.js
- **State**: Global Alpine store (upload state, UI states)
- **API**: Fetch to 3 endpoints (upload, convert, download)

### 2. Backend (Node.js + Express)
- **Server**: Express.js on port 3002
- **Routes**: 3 API routes + 1 health check
- **Processing**: Piscina worker threads (multi-threaded)
- **Storage**: Cloudflare R2 (S3-compatible)

### 3. Conversion Pipeline
```
PDF Upload → R2 Storage → Piscina Worker
  ↓
LibreOffice CLI → Format Conversion → Sharp (image optimization)
  ↓
Upload to R2 → Database Record → Download Link
  ↓
10-minute Auto-Delete Scheduler
```

### 4. Database (SQLite)
- **Schema**: 1 table (`files`)
- **Purpose**: Track converted files for 10-minute expiry
- **Mode**: WAL (concurrent access)
- **Queries**: Simple prepared statements

---

## Data Flow: User Perspective

```
1. User selects PDF file
   ↓
2. Frontend: POST /api/upload (FormData)
   ↓ Server processes:
   - Validate MIME type (PDF only)
   - Upload to R2
   - Return r2Path
   ↓
3. Frontend displays "Ready to convert"
   ↓
4. User clicks format button (word/excel/ppt/jpg/png)
   ↓
5. Frontend: POST /api/convert (r2Path, format)
   ↓ Server processes:
   - Download PDF from R2
   - Spawn Piscina worker
   - LibreOffice converts format
   - Sharp optimizes (if image)
   - Upload result to R2
   - Insert into DB
   - Delete original PDF
   - Return fileId
   ↓
6. Frontend displays "Download" button
   ↓
7. User clicks download
   ↓
8. Frontend: GET /api/download/:fileId
   ↓ Server:
   - Query DB for file
   - Download from R2
   - Send as attachment
   ↓
9. Browser downloads file
   ↓
10. After 10 minutes: Scheduler deletes from R2 + DB
```

---

## Directory Map

```
├── config/               # Setup files
│   ├── db.js            # SQLite initialization
│   └── r2.js            # R2 client (upload/download/delete)
│
├── middlewares/          # Express middleware
│   └── upload.js        # Multer (PDF validation)
│
├── routes/              # API handlers
│   ├── uploadRoutes.js  # POST /api/upload
│   ├── convertRoutes.js # POST /api/convert (6-step process)
│   └── downloadRoutes.js # GET /api/download/:fileId
│
├── utils/              # Utilities
│   ├── constants.js    # Env vars & constants
│   ├── scheduler.js    # 10-minute cleanup job
│   ├── converterPool.js # Piscina manager
│   └── converters/     # LibreOffice workers
│       ├── converter.task.js
│       ├── convertPdfToWord.js
│       ├── convertPdfToExcel.js
│       ├── convertPdfToPpt.js
│       └── convertPdfToImage.js
│
├── public/             # Frontend
│   ├── index.html      # Landing page
│   ├── word.html       # PDF→Word UI
│   ├── excel.html      # PDF→Excel UI
│   ├── ppt.html        # PDF→PPT UI
│   ├── jpg.html        # PDF→JPG UI
│   ├── png.html        # PDF→PNG UI
│   ├── script.js       # Alpine store + API calls
│   └── styles.css      # Bootstrap + custom
│
├── server.js           # Entry point
├── package.json        # Dependencies
├── .env               # Secrets
└── db/                # SQLite storage directory
    └── database.db    # Runtime SQLite DB
```

---

## Key Decisions & Tradeoffs

| Decision | Why | Tradeoff |
|----------|-----|----------|
| **In-memory upload** | Fast, simple | Limited to 50MB files |
| **R2 storage** | No egress fees | Vendor lock-in |
| **Piscina workers** | Non-blocking conversions | Memory overhead |
| **10-min expiry** | Simple cleanup | Limited download window |
| **SQLite** | Zero setup | Not scalable to 1M+ files |
| **Alpine.js** | Minimal bundle | No routing/state library |
| **Memory buffer** | Simple API | Can't process huge files |

---

## Performance Numbers (Estimated)

| Operation | Time | Notes |
|-----------|------|-------|
| File upload | 1-3s | Depends on file size & network |
| PDF→Word | 5-15s | LibreOffice startup time |
| PDF→Excel | 5-15s | Similar to Word |
| PDF→Image | 3-8s | + Sharp optimization |
| DB cleanup | <100ms | Runs every 10 min |
| File download | 0.5-2s | Depends on file size |

---

## Security Features

- **Helmet**: CSP headers, no-sniff, X-frame-options
- **CORS**: Enabled for all origins (change in production)
- **File validation**: PDF MIME type only
- **Size limit**: 50MB max
- **Storage isolation**: Files deleted after 10 minutes
- **No auth**: Public service (add auth if needed)

---

## Configuration (Environment)

Required in `.env`:
```
PORT=3002
NODE_ENV=development
R2_ENDPOINT=https://...
R2_BUCKET=convert-for-you
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
CONVERTER_MAX_THREADS=4
CONVERTER_TIMEOUT=300000
```

---

## Adding a New Format

To add PDF→Format support:

1. Create `/utils/converters/convertPdfTo{Format}.js`
   ```js
   module.exports = async (pdfBuffer) => {
     // Temp file → LibreOffice → Read output → Return buffer
   }
   ```

2. Import in `converter.task.js` switch statement

3. Add to `EXTENSION_MAP` in `constants.js`

4. Create new HTML page in `/public/{format}.html`

5. Test the flow

---

## Scaling Ideas

- **Queue system**: Redis + Bull for job queueing
- **Horizontal scaling**: Multiple servers + load balancer
- **Caching**: Redis for frequently converted files
- **WebSocket**: Real-time progress updates
- **Streaming**: Process files in chunks
- **CDN**: Serve static assets from CloudFront
- **Database**: PostgreSQL for high-volume tracking

---

## Known Limitations

1. **Single page conversions only** (PDF→JPG converts first page)
2. **No authentication** (public service)
3. **No rate limiting** (add if needed)
4. **No progress tracking** (all-or-nothing)
5. **No file preview** (download only)
6. **R2 dependency** (can't use local disk)
7. **10-minute hard limit** (not configurable)
8. **No batch processing** (single file only)

---

## Tech Stack Highlights

| Layer | Tech | Why |
|-------|------|-----|
| Web | Express | Minimal, fast |
| Compute | Piscina | True parallelism |
| Conversion | LibreOffice | Industry standard |
| Image | Sharp | Fast, small, reliable |
| Storage | R2 | Cheap egress, S3-compatible |
| DB | SQLite | Zero ops, fast reads |
| Frontend | Alpine + Bootstrap | Lightweight, responsive |

---

## Monitoring Checklist

- [ ] Check `/test` endpoint responds
- [ ] Monitor disk space (temp files)
- [ ] Monitor DB size growth
- [ ] Check R2 storage usage
- [ ] Monitor conversion errors in logs
- [ ] Verify scheduler runs every 10 min
- [ ] Check Piscina worker pool health
- [ ] Monitor LibreOffice process count

---

Generated: 2024-11-04
