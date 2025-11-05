# PDF Converter Application - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Database Schema](#database-schema)
5. [Backend Configuration](#backend-configuration)
6. [API Endpoints](#api-endpoints)
7. [File Converters](#file-converters)
8. [Frontend Architecture](#frontend-architecture)
9. [Key Dependencies & Usage](#key-dependencies--usage)
10. [Data Flow](#data-flow)
11. [Security & Configuration](#security--configuration)

---

## Project Overview

**PDF Converter** is a full-stack web application that converts PDF files to multiple formats (Word, Excel, PowerPoint, JPG, PNG) using LibreOffice and cloud storage (Cloudflare R2). The application features:

- **Formats Supported**: 
  - PDF → Word (.docx)
  - PDF → Excel (.xlsx)
  - PDF → PowerPoint (.pptx)
  - PDF → JPG (image)
  - PDF → PNG (image)

- **Key Features**:
  - Drag-and-drop file upload
  - Real-time conversion with progress tracking
  - Automatic file cleanup (10-minute expiry)
  - Multi-threaded processing (Piscina)
  - Cloud storage integration (Cloudflare R2)
  - Google AdSense monetization ready
  - Responsive Bootstrap 5 UI with Alpine.js

- **Tech Stack**: Node.js, Express, SQLite, LibreOffice, Piscina, AWS S3 SDK, Sharp

---

## Directory Structure

```
convert_own/
├── config/                    # Application configuration
│   ├── db.js                 # SQLite database setup & schema
│   └── r2.js                 # Cloudflare R2 storage client
│
├── middlewares/               # Express middlewares
│   └── upload.js             # Multer file upload configuration
│
├── routes/                    # API route handlers
│   ├── uploadRoutes.js       # File upload to R2
│   ├── convertRoutes.js      # File conversion orchestration
│   └── downloadRoutes.js     # File download from R2
│
├── utils/                     # Utility functions & helpers
│   ├── constants.js          # Application constants
│   ├── scheduler.js          # Automatic file cleanup scheduler
│   ├── converterPool.js      # Piscina thread pool manager
│   └── converters/           # Conversion implementation modules
│       ├── converter.task.js      # Piscina worker entry point
│       ├── convertPdfToWord.js    # LibreOffice Word conversion
│       ├── convertPdfToExcel.js   # LibreOffice Excel conversion
│       ├── convertPdfToPpt.js     # LibreOffice PowerPoint conversion
│       └── convertPdfToImage.js   # LibreOffice + Sharp image conversion
│
├── public/                    # Frontend assets
│   ├── index.html            # Homepage with converter selection
│   ├── word.html             # PDF to Word converter UI
│   ├── excel.html            # PDF to Excel converter UI
│   ├── ppt.html              # PDF to PowerPoint converter UI
│   ├── jpg.html              # PDF to JPG converter UI
│   ├── png.html              # PDF to PNG converter UI
│   ├── script.js             # Alpine.js store & API functions
│   └── styles.css            # Bootstrap + custom styling
│
├── .env                       # Environment variables
├── package.json              # Dependencies & scripts
├── server.js                 # Express app entry point
└── db/                       # SQLite database directory
    └── database.db           # Runtime SQLite database file
```

---

## Architecture & Technology Stack

### Backend Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime | Latest LTS |
| **Express** | Web framework | ^4.18.2 |
| **better-sqlite3** | SQL database | ^12.4.1 |
| **Piscina** | Worker thread pool | ^5.1.3 |
| **libreoffice-convert** | Document conversion | ^1.7.0 |
| **Sharp** | Image optimization | ^0.34.4 |
| **@aws-sdk/client-s3** | Cloudflare R2 client | ^3.500.0 |
| **Archiver** | ZIP file creation | ^6.0.2 |
| **Multer** | File upload handling | ^2.0.2 |
| **Helmet** | HTTP security | ^8.1.0 |
| **CORS** | Cross-origin requests | ^2.8.5 |
| **Morgan** | HTTP logging | ^1.10.1 |
| **node-schedule** | Task scheduling | ^2.1.1 |
| **Compression** | Response compression | ^1.8.1 |
| **Nodemon** | Auto-restart on file changes | ^3.1.10 |
| **dotenv** | Environment variables | ^16.3.1 |

### Frontend Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Bootstrap** | CSS framework | 5.3.0 |
| **Alpine.js** | Reactive components | 3.x |
| **Vanilla JS** | API integration | - |

### Infrastructure

- **Storage**: Cloudflare R2 (S3-compatible)
- **Database**: SQLite with WAL mode
- **Concurrency**: Piscina worker threads
- **Scheduling**: node-schedule (10-minute cleanup cycle)

---

## Database Schema

### Files Table

```sql
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT UNIQUE NOT NULL,           -- UUID: {timestamp}-{random}
  r2_path TEXT NOT NULL,                  -- R2 storage path
  file_type TEXT NOT NULL,                -- 'converted' (only converted files tracked)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,           -- Set to current_time + 10 minutes
  deleted_at DATETIME,                    -- Timestamp when actually deleted
  status TEXT DEFAULT 'active'            -- 'active', 'deleted', 'failed'
);

-- Indexes for efficient queries
CREATE INDEX idx_file_id ON files(file_id);
CREATE INDEX idx_expires_at ON files(expires_at);
CREATE INDEX idx_status ON files(status);
```

### Database Configuration (PRAGMA)

```javascript
PRAGMA journal_mode = WAL;        // Write-Ahead Logging for concurrency
PRAGMA synchronous = NORMAL;      // Balance speed & safety
PRAGMA foreign_keys = ON;         // Enforce relationships
PRAGMA temp_store = MEMORY;       // In-memory temp tables
PRAGMA cache_size = -2000;        // ~2MB cache
PRAGMA auto_vacuum = FULL;        // Auto-reclaim deleted space
```

### File ID Format
- Format: `{timestamp}-{random}`
- Example: `1733367890123-abc123`
- Ensures unique, sortable identifiers

---

## Backend Configuration

### `config/db.js`

Initializes SQLite database with:
- WAL (Write-Ahead Logging) for concurrent access
- Foreign key constraints
- Automatic file tracking table
- Indexes for file lookups

### `config/r2.js`

**Cloudflare R2 Client** - Provides functions for:

| Function | Purpose |
|----------|---------|
| `uploadToR2(key, body, contentType)` | Upload file buffer to R2 |
| `downloadFromR2(key)` | Download file from R2 as Buffer |
| `deleteFromR2(key)` | Delete file from R2 |
| `generateR2Path(originalName, folder)` | Generate unique R2 path with timestamp |

**Environment Variables Required**:
```
R2_ENDPOINT=https://d633a7c3cd0cd71ea3144f17896d4e65.r2.cloudflarestorage.com
R2_BUCKET=convert-for-you
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

### `utils/constants.js`

```javascript
PORT = 3002 (default)
NODE_ENV = 'development'
UPLOAD_DIR = './uploads'
MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB
EXTENSION_MAP = {
  'word': '.docx',
  'excel': '.xlsx',
  'ppt': '.pptx',
  'jpg': '.zip',  // Multi-page ZIP archive
  'png': '.zip'   // Multi-page ZIP archive
}
CONVERSION_DELAY = 2000  // Simulated delay (ms)
ADSENSE_PUBLISHER_ID = 'ca-pub-...'
```

**Note**: JPG and PNG formats now return ZIP files containing all converted pages as individual images.

### `middlewares/upload.js`

**Multer Configuration**:
- Storage: Memory-based (before R2 upload)
- File filter: PDF files only (MIME type: `application/pdf`)
- Size limit: 50MB
- Single file per request

---

## API Endpoints

### 1. POST `/api/upload`

**Purpose**: Upload PDF file to Cloudflare R2

**Request**:
```
Method: POST
Content-Type: multipart/form-data
Body: file (PDF file)
```

**Response** (Success):
```json
{
  "success": true,
  "fileName": "document.pdf",
  "r2Path": "uploads/1733367890123-abc123.pdf",
  "size": 1024000,
  "url": "https://r2.example.com/uploads/..."
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "PDF 파일만 업로드 가능합니다."
}
```

**Flow**:
1. Multer validates PDF file in memory
2. Generate unique R2 path with timestamp
3. Upload buffer to Cloudflare R2
4. Return R2 path and metadata

---

### 2. POST `/api/convert`

**Purpose**: Convert PDF from R2 to target format using Piscina worker pool

**Request**:
```json
{
  "r2Path": "uploads/1733367890123-abc123.pdf",
  "format": "word|excel|ppt|jpg|png",
  "originalName": "document.pdf"
}
```

**Response** (Success):
```json
{
  "success": true,
  "fileId": "1733367890456-def456",
  "r2Path": "converted/1733367890456-def456.docx",
  "fileName": "document_converted.docx",
  "message": "변환 완료: document_converted.docx"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "파일 변환에 실패했습니다.",
  "details": "error message"
}
```

**Conversion Flow** (6 Steps):
```
1. [Download] Fetch PDF from R2 to memory
2. [Convert]  Piscina worker: PDF → target format (LibreOffice)
3. [Generate] Create output filename: {original}_converted.{ext}
4. [Upload]   Upload converted file to R2 (/converted folder)
5. [Track]    Insert file metadata in SQLite DB (expires_at = now + 10min)
6. [Cleanup]  Delete original PDF from R2 immediately
```

**Database Entry**:
```javascript
{
  file_id: "1733367890456-def456",
  r2_path: "converted/1733367890456-def456.docx",
  file_type: "converted",
  created_at: "2024-11-04 19:48:00",
  expires_at: "2024-11-04 19:58:00",  // 10 minutes later
  deleted_at: null,
  status: "active"
}
```

---

### 3. GET `/api/download/:fileId`

**Purpose**: Download converted file from R2

**Request**:
```
Method: GET
URL: /api/download/1733367890456-def456
```

**Response** (Success):
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document_converted.docx"
Body: Binary file data
```

**Response** (Error):
```json
{
  "success": false,
  "error": "파일을 찾을 수 없습니다."
}
```

**Flow**:
1. Query DB for file_id with status='active'
2. If found, download from R2
3. Send as attachment to client browser
4. Note: File stays in DB until scheduler deletes it

---

### 4. GET `/test`

**Purpose**: Health check endpoint

**Response**:
```json
{
  "message": "서버가 정상 작동 중입니다."
}
```

---

## File Converters

### `utils/converterPool.js` - Piscina Thread Pool Manager

**Configuration**:
```javascript
MIN_THREADS = 2  // Minimum worker threads
MAX_THREADS = CPU core count  // Maximum workers
TIMEOUT = 300000  // 5 minutes per task
IDLE_TIMEOUT = 30000  // Kill thread after 30s idle
CONCURRENT_TASKS_PER_WORKER = 1  // CPU-bound, no parallelism
```

**Functions**:

| Function | Purpose |
|----------|---------|
| `convert(pdfBuffer, format)` | Submit conversion job to pool |
| `getStats()` | Return pool configuration stats |
| `destroy()` | Graceful shutdown of worker pool |

**Worker Communication**:
- Uses Node.js `worker_threads` with `parentPort.on('message')`
- Transfers large buffers efficiently between threads

---

### `utils/converters/converter.task.js` - Worker Entry Point

**Piscina Worker Script** - Runs in separate thread:

```javascript
// Receives: { pdfBuffer: Buffer, format: string }
// Returns: { success: bool, buffer: Buffer, format: string }

switch(format) {
  case 'word': convertToWord(pdfBuffer)
  case 'excel': convertToExcel(pdfBuffer)
  case 'ppt': convertToPpt(pdfBuffer)
  case 'jpg': convertToImage(pdfBuffer, 'jpg')
  case 'png': convertToImage(pdfBuffer, 'png')
}
```

---

### PDF Conversion Modules

#### `convertPdfToWord.js`

**Process**:
1. Write PDF buffer to temp file: `/tmp/pdf-to-word-{timestamp}-input.pdf`
2. Call LibreOffice: `libreoffice-convert(input, output, {format: 'docx'})`
3. Read converted `.docx` file
4. Cleanup temp files
5. Return buffer

**Command** (internally executed):
```bash
libreoffice --headless --convert-to docx input.pdf --outdir /tmp
```

#### `convertPdfToExcel.js`

Same pattern as Word, but with `.xlsx` format

**LibreOffice command**:
```bash
libreoffice --headless --convert-to xlsx input.pdf --outdir /tmp
```

#### `convertPdfToPpt.js`

Same pattern as Word, but with `.pptx` format

**LibreOffice command**:
```bash
libreoffice --headless --convert-to pptx input.pdf --outdir /tmp
```

#### `convertPdfToImage.js`

**Multi-page image conversion with ZIP packaging**:

1. Write PDF to temp file
2. Use pdftoppm to convert **all pages** to PNG images
3. Optimize each page image with Sharp:
   - **JPG**: JPEG quality 90, progressive encoding
   - **PNG**: Compression level 9 (maximum)
4. Create ZIP archive containing all optimized images
5. File naming: `page-001.jpg`, `page-002.jpg`, ... (page-NNN.format)
6. Return ZIP buffer

**Process Flow**:
```
PDF → pdftoppm → page-0001.png, page-0002.png, ...
              ↓
           Sharp optimization (JPG or PNG)
              ↓
           Archiver → output.zip
              ↓
           Return ZIP buffer
```

**Key Functions**:
- `runPdftoppm()`: Converts all PDF pages to PNG (300 DPI)
- `getAllPngFiles()`: Collects and sorts all generated PNG files
- `optimizeImage()`: Applies Sharp compression to each image
- `createZipFromImages()`: Packages optimized images into ZIP

---

## Frontend Architecture

### HTML Files Structure

All converter pages follow identical structure with format-specific styles:

| File | Format | Hero Color |
|------|--------|-----------|
| `index.html` | Landing page | Purple |
| `word.html` | PDF → Word | Blue |
| `excel.html` | PDF → Excel | Green |
| `ppt.html` | PDF → PowerPoint | Orange |
| `jpg.html` | PDF → JPG | Red |
| `png.html` | PDF → PNG | Pink |

### Page Structure (word.html example)

```html
<nav>                    <!-- Sticky header with navbar -->
<section class="hero">   <!-- Hero section with format title -->
<section class="ad">     <!-- Top banner ad (728x90) -->
<section>               
  <div class="ad-side">  <!-- Left sidebar ad (300x600) -->
  <div class="upload-box"> <!-- Main upload component -->
  <div class="ad-side">  <!-- Right sidebar ad (300x600) -->
</section>
<section class="ad">     <!-- Middle ad (300x250) -->
<section>               <!-- Converter selection cards -->
<section class="ad">     <!-- Another ad space -->
<section>               <!-- Features grid -->
<section class="ad">     <!-- Bottom banner ad -->
<footer>                <!-- Footer with links -->
```

### Alpine.js State Management

**Global Store**: `Alpine.store('upload')`

```javascript
{
  selectedFile: File | null,        // Selected PDF file object
  uploadedR2Path: string | null,   // R2 path of uploaded file
  isConverting: boolean,           // Conversion in progress
  isCompleted: boolean,            // Conversion complete
  isDragover: boolean,             // Drag-over state
  convertedFileId: string | null,  // File ID from API response
  convertedFileName: string,       // Converted filename
  errorMessage: string,            // Error display text
  
  // Methods:
  setFile(file),        // Validate & upload PDF
  startConvert(format), // Start conversion
  download(),          // Download converted file
  reset()              // Reset all state
}
```

### JavaScript Functions (`script.js`)

#### 1. State Initialization

```javascript
// Alpine.js store auto-initialized on DOM ready
Alpine.store('upload')  // Global reactive state
```

#### 2. File Upload (`uploadFile(file, store)`)

**Flow**:
```
1. Create FormData with file
2. POST /api/upload
3. Store response.r2Path
4. Update UI reactively via Alpine
```

**API Call**:
```javascript
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

#### 3. File Conversion (`convertFile(r2Path, format, store)`)

**Flow**:
```
1. POST /api/convert with r2Path & format
2. Store fileId & fileName
3. Update UI to show download button
```

**API Call**:
```javascript
const response = await fetch('/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    r2Path: r2Path,
    format: format,
    originalName: store.selectedFile.name
  })
});
```

#### 4. File Download (`downloadFile(fileId, fileName)`)

**Flow**:
```
1. Fetch /api/download/:fileId
2. Convert response to Blob
3. Create <a> element with download attribute
4. Trigger click to download
5. Cleanup ObjectURL
```

---

## Key Dependencies & Usage

### Express (^4.18.2)

**Usage**:
```javascript
const app = express();
app.use(helmet());           // Security headers
app.use(cors());            // CORS middleware
app.use(morgan('dev'));     // HTTP logging
app.use(express.json());    // JSON parsing
app.use(compression());     // Response compression
app.use('/api/upload', uploadRoutes);
app.listen(PORT);
```

### SQLite with better-sqlite3 (^12.4.1)

**Usage**:
```javascript
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve(__dirname, '../db/database.db'));

// Synchronous API
const stmt = db.prepare('SELECT * FROM files WHERE file_id = ?');
const file = stmt.get(fileId);

// Batch operations
const insert = db.prepare('INSERT INTO files (...) VALUES (...)');
insert.run(fileId, r2Path, fileType, expiresAt, status);
```

**Advantages**:
- Synchronous API prevents callback hell
- Better performance for small-to-medium datasets
- Built-in caching and optimization

### Multer (^2.0.2)

**Usage**:
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF only'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// In route:
router.post('/', upload.single('file'), (req, res) => {
  const buffer = req.file.buffer;  // In-memory buffer
});
```

### Piscina (^5.1.3)

**Usage**:
```javascript
const Piscina = require('piscina');
const pool = new Piscina({
  filename: 'converters/converter.task.js',
  minThreads: 2,
  maxThreads: 4,
  taskTimeout: 300000,
  concurrentTasksPerWorker: 1
});

const result = await pool.run({
  pdfBuffer: buffer,
  format: 'word'
});
// Returns: { success: true, buffer: Buffer }
```

**Benefits**:
- True parallelism with worker threads
- CPU-intensive operations don't block event loop
- Automatic thread pooling & management

### LibreOffice Convert (^1.7.0)

**Usage**:
```javascript
const libreofficeConvert = require('libreoffice-convert');

await new Promise((resolve, reject) => {
  libreofficeConvert.convert(
    inputPath,
    outputPath,
    { format: 'docx' },  // Target format
    (err, result) => {
      if (err) reject(err);
      else resolve(result);
    }
  );
});
```

**Supported Formats**:
- Office: `docx`, `xlsx`, `pptx`
- Images: `pdf`, `png`, `jpg`
- Text: `txt`, `csv`

**Requirements**:
```bash
# Must be installed on system
sudo apt-get install libreoffice libreoffice-calc
# Or on macOS:
brew install libreoffice
```

### Sharp (^0.34.4)

**Usage** (Image Optimization):
```javascript
const sharp = require('sharp');

// JPG conversion & optimization
const jpgBuffer = await sharp(pngBuffer)
  .jpeg({ quality: 90, progressive: true })
  .toBuffer();

// PNG optimization
const pngBuffer = await sharp(pngBuffer)
  .png({ compressionLevel: 9 })
  .toBuffer();
```

**Benefits**:
- Fast image processing (libvips backend)
- Reduces image file size
- Consistent quality across formats

### AWS SDK S3 Client (^3.500.0)

**Usage** (Cloudflare R2):
```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.R2_ENDPOINT
});

const command = new PutObjectCommand({
  Bucket: 'convert-for-you',
  Key: 'uploads/file-123.pdf',
  Body: fileBuffer,
  ContentType: 'application/pdf'
});

await r2Client.send(command);
```

**Cloudflare R2 Benefits**:
- S3-compatible API (same SDK)
- No egress charges
- 10GB free/month
- Lower cost than AWS S3

### Node-Schedule (^2.1.1)

**Usage**:
```javascript
const schedule = require('node-schedule');

// Run every 10 minutes
schedule.scheduleJob('*/10 * * * *', async () => {
  await cleanupExpiredFiles();
});

// Cron pattern: '*/10 * * * *'
// Minute: */10 (every 10 minutes)
// Hour: * (every hour)
// Day of month: * (every day)
// Month: * (every month)
// Day of week: * (every day of week)
```

**Scheduler Flow** (`utils/scheduler.js`):
```
1. Query DB for expired files: WHERE expires_at <= NOW()
2. For each expired file:
   a. Delete from R2: deleteFromR2(r2_path)
   b. Update DB: status='deleted', deleted_at=NOW()
3. On error: status='failed' for manual review
```

---

## Data Flow

### Complete Conversion Workflow

```
CLIENT                    SERVER                    STORAGE
  |                          |                          |
  |--- Upload PDF ---------->|                          |
  |                          |                          |
  |                          |--- Store in Memory -------|
  |                          |
  |                          |--- Upload to R2 -------->|
  |<-- R2 path returned ------|<------ Return ---------|
  |                          |
  |--- Convert Request ----->|
  |                          |
  |                          |--- Download from R2 ---->|
  |                          |<----- PDF buffer --------|
  |                          |
  |                          |--- Spawn Piscina -------|
  |                          |  Worker Thread:        |
  |                          |  1. Write to /tmp      |
  |                          |  2. LibreOffice conv   |
  |                          |  3. Read output        |
  |                          |  4. Cleanup /tmp       |
  |                          |  5. Return buffer      |
  |                          |<------ Result ---------|
  |                          |
  |                          |--- Upload to R2 ------->|
  |                          |<----- Confirm ---------|
  |                          |
  |                          |--- Insert to DB ------->|
  |                          |  {file_id, r2_path,   |
  |                          |   expires_at=+10min}  |
  |                          |
  |                          |--- Delete Original ------>|
  |<-- FileID returned -------|<------- Done ----------|
  |
  |--- Download Request ---->|
  |                          |--- Query DB for file ---|
  |                          |--- Download from R2 ---->|
  |<-- File Data ------------|<----- Return ---------|
  |
  [After 10 minutes, Scheduler runs]
  |                          |--- Check expires_at ---|
  |                          |--- Delete from R2 ------>|
  |                          |<------- Done ----------|
  |                          |
  |                          |--- Update DB status ---|
  |                          |  status='deleted' |
```

---

## Security & Configuration

### Helmet Security Headers

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
```

### CORS Configuration

```javascript
app.use(cors());  // Allow all origins (configurable via env)
```

### File Size Limits

- Upload max: 50MB (configurable)
- Multer: 50MB limit in middleware
- Express: Default limits

### File Cleanup

- **Strategy**: Time-based expiration
- **Duration**: 10 minutes after conversion
- **Execution**: Every 10 minutes via scheduler
- **Verification**: Database query for expired files

### Environment Variables

```bash
# Server
PORT=3002
NODE_ENV=development

# Files
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=./uploads
CONVERTER_MIN_THREADS=2
CONVERTER_MAX_THREADS=4
CONVERTER_TIMEOUT=300000  # 5 minutes

# R2 Storage
R2_ENDPOINT=https://d633a7c3cd0cd71ea3144f17896d4e65.r2.cloudflarestorage.com
R2_BUCKET=convert-for-you
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# Monetization
ADSENSE_PUBLISHER_ID=ca-pub-...
```

### Temporary Files Cleanup

- **Location**: System temp directory (`os.tmpdir()`)
- **Pattern**: `/tmp/pdf-to-{format}-{timestamp}-{input|output}.{ext}`
- **Cleanup**: `finally` block in each converter
- **Fallback**: Graceful error if cleanup fails

---

## Performance Optimizations

### Database Optimizations
- **WAL Mode**: Concurrent reads during writes
- **Memory Cache**: 2MB page cache
- **Indexes**: On frequently queried columns (file_id, expires_at, status)
- **Connection Pool**: Better-sqlite3 built-in

### Conversion Optimizations
- **Piscina Workers**: Multi-threaded processing
- **Memory Storage**: No disk I/O for uploads
- **Stream Processing**: For large files (potential)
- **Image Optimization**: Sharp compression

### Network Optimizations
- **Response Compression**: gzip via compression middleware
- **CDN**: Bootstrap & Alpine.js from CDN
- **Static Assets**: Express.static with caching headers

### Frontend Optimizations
- **Alpine.js**: Lightweight reactive framework
- **Lazy Components**: Template rendering with x-if
- **Minimal JS**: ~160 lines of application code
- **CSS**: Bootstrap 5 + minimal custom styles

---

## Monitoring & Logging

### Console Output

**Upload**:
```
✅ R2 업로드 성공: uploads/1733367890123-abc123.pdf
```

**Conversion**:
```
========== 파일 변환 시작 ==========
[1/5] 📥 R2에서 PDF 파일 다운로드
✅ 다운로드 완료 (1.23MB)
[2/5] 🔄 Piscina에서 변환 작업 실행
✅ 변환 완료 (0.89MB)
[3/5] 📝 파일명 생성
[4/5] 📤 R2에 변환된 파일 업로드
[5/5] 💾 DB에 파일 정보 저장
========== 변환 완료 ==========
```

**Cleanup Scheduler**:
```
🔍 [2024-11-04T19:48:00Z] 만료된 파일 정리 시작...
⏰ 만료된 파일 3개 발견
🗑️ R2에서 삭제: converted/...
✅ 완료: 1733367890456-def456
🎉 만료된 파일 정리 완료
```

### HTTP Logging (Morgan)

```
POST /api/upload 200 123.45 ms
POST /api/convert 200 2345.67 ms
GET /api/download/:fileId 200 45.23 ms
```

---

## Deployment Considerations

### System Requirements
- Node.js 16+ (for worker_threads support)
- LibreOffice CLI tool installed
- 2+ GB RAM (for Piscina workers + conversions)
- Cloudflare R2 account

### Environment Setup
```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Update with production values
EDIT .env

# Initialize database
node -e "require('./config/db')"

# Start server
npm start
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Update `PORT` if needed
- [ ] Configure R2 credentials
- [ ] Set `CONVERTER_MAX_THREADS` based on CPU
- [ ] Configure CORS_ORIGIN
- [ ] Update ADSENSE_PUBLISHER_ID
- [ ] Set up monitoring/alerts
- [ ] Enable HTTPS/SSL
- [ ] Configure backup strategy for DB

---

## Common Issues & Solutions

### Issue: Conversion times out

**Solution**:
- Increase `CONVERTER_TIMEOUT` in .env
- Reduce `CONVERTER_MAX_THREADS` if CPU-bound
- Check LibreOffice installation

### Issue: R2 upload fails

**Solution**:
- Verify R2 credentials in .env
- Check R2 bucket name
- Ensure enough storage space
- Check network connectivity

### Issue: Files not cleaning up

**Solution**:
- Verify scheduler is running
- Check database for stale entries
- Verify R2 delete permissions
- Check `expires_at` values in DB

### Issue: High memory usage

**Solution**:
- Reduce `CONVERTER_MAX_THREADS`
- Implement file streaming for downloads
- Monitor Piscina worker lifecycle
- Set `idleTimeout` to cleanup unused workers

---

## Future Enhancements

1. **Batch Conversion**: Multiple files in one request
2. **Format Detection**: Auto-detect input format beyond PDF
3. **Advanced Scheduling**: User-defined expiry times
4. **Resume Support**: Large file upload resumption
5. **Queue System**: Redis-based job queue for scaling
6. **WebSocket**: Real-time progress updates
7. **API Keys**: Token-based authentication
8. **Rate Limiting**: Prevent abuse
9. **Analytics**: Conversion statistics & user tracking
10. **Mobile App**: Native iOS/Android app

---

## API Reference Summary

| Endpoint | Method | Auth | Returns |
|----------|--------|------|---------|
| `/api/upload` | POST | None | `{ success, fileName, r2Path, size, url }` |
| `/api/convert` | POST | None | `{ success, fileId, r2Path, fileName }` |
| `/api/download/:fileId` | GET | None | Binary file |
| `/test` | GET | None | `{ message }` |

---

## File Size Guidelines

| Format | Avg Size | Notes |
|--------|----------|-------|
| PDF (input) | 1-50 MB | Typical documents |
| DOCX (Word) | 0.5-2x PDF | Usually smaller |
| XLSX (Excel) | 0.3-1x PDF | Depends on tables |
| PPTX (PPT) | 0.5-3x PDF | Large images impact |
| JPG (ZIP) | 0.5-10 MB | All pages, 300 DPI |
| PNG (ZIP) | 1-20 MB | All pages, lossless compression |

---

## Recent Updates

### Version 2.0 - Multi-page Image Support (2024-11-05)

**Major Changes**:
- ✅ PDF → JPG/PNG now converts **all pages** instead of first page only
- ✅ All pages packaged as ZIP archive with optimized images
- ✅ Added Archiver library for ZIP creation
- ✅ Added Nodemon for automatic server restart during development
- ✅ Improved UI button styles and text across all converter pages
- ✅ File extensions changed: jpg/png → .zip format

**File Naming Convention**:
- Images in ZIP: `page-001.jpg`, `page-002.jpg`, `page-003.jpg`, ...
- Consistent zero-padded numbering for easy sorting
- Supports PDFs with hundreds of pages

**Performance Improvements**:
- Parallel image optimization using Sharp
- Efficient ZIP compression (level 9)
- Reduced memory footprint through streaming

---

Generated by Claude Code | Last Updated: 2024-11-05
