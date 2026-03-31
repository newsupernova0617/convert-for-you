# Turso + Drizzle ORM Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace better-sqlite3 + raw SQL with Turso + Drizzle ORM for SQL injection prevention and improved developer experience.

**Architecture:** Phased migration by feature (Setup → Admin API → File Metadata → Dashboard → Scheduler), maintaining API compatibility throughout.

**Tech Stack:** Turso (managed SQLite), Drizzle ORM (JS query builder), better-sqlite3 → @libsql/client transition

---

## File Structure Overview

**New files:**
- `config/db.js` — Turso client initialization
- `drizzle/schema.js` — Drizzle table definitions
- `drizzle/drizzle.config.js` — Drizzle CLI configuration
- `drizzle/migrations/` — Auto-generated migration files

**Modified files:**
- `routes/adminRoutes.js` — Drizzle queries in admin endpoints
- `routes/convertRoutes.js` — Drizzle insert for file metadata
- `routes/downloadRoutes.js` — Drizzle select for file lookup
- `utils/dashboard.js` — Drizzle aggregates (count, where, etc)
- `utils/scheduler.js` — Drizzle delete/update for cleanup
- `package.json` — Add drizzle dependencies and npm scripts
- `__tests__/adminRoutes.test.js`, `download.test.js`, `database.test.js` — Update mocks

---

## Phase 1: Setup

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add drizzle dependencies to package.json**

Open `package.json` and update the `dependencies` and `devDependencies` sections:

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.500.0",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    "@libsql/client": "^0.5.0",
    "archiver": "^6.0.2",
    "better-sqlite3": "^12.4.1",
    "compression": "^1.8.1",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.30.0",
    "ejs": "^3.1.10",
    "express": "^4.18.2",
    "express-rate-limit": "^8.2.1",
    "file-type": "^18.7.0",
    "fluent-ffmpeg": "^2.1.3",
    "heic-convert": "^2.1.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.1",
    "multer": "^2.0.2",
    "node-schedule": "^2.1.1",
    "pdf-lib": "^1.17.1",
    "piscina": "^5.1.3",
    "sharp": "^0.34.4"
  },
  "devDependencies": {
    "dotenv": "^17.2.3",
    "drizzle-kit": "^0.20.0",
    "jest": "^30.2.0",
    "nodemon": "^3.1.10",
    "supertest": "^7.1.4"
  },
  "scripts": {
    "start": "nodemon server.js",
    "dev": "nodemon server.js",
    "test": "jest --forceExit --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "generate": "node src/generatePages.js",
    "build": "npm run generate",
    "drizzle:generate": "drizzle-kit generate:sqlite --config drizzle/drizzle.config.js",
    "drizzle:migrate": "drizzle-kit migrate:sqlite --config drizzle/drizzle.config.js",
    "drizzle:info": "drizzle-kit info:sqlite --config drizzle/drizzle.config.js",
    "db:setup": "npm run drizzle:generate && npm run drizzle:migrate"
  }
}
```

- [ ] **Step 2: Run npm install**

```bash
npm install
```

Expected: Installation completes successfully, `drizzle-orm` and `@libsql/client` appear in `node_modules/`

- [ ] **Step 3: Verify installation**

```bash
npm run drizzle:info
```

Expected: Error about missing config (that's OK for now, we'll create it next)

---

### Task 2: Create Drizzle Schema

**Files:**
- Create: `drizzle/schema.js`

- [ ] **Step 1: Create schema file**

Create `drizzle/schema.js` with the following content:

```javascript
const { sqliteTable, text, integer, index } = require('drizzle-orm/sqlite-core');

/**
 * Files table schema - mirrors existing SQLite structure
 * Represents converted files stored in R2
 */
const files = sqliteTable(
  'files',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fileId: text('file_id').unique().notNull(),
    r2Path: text('r2_path').notNull(),
    fileType: text('file_type').notNull(),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    expiresAt: text('expires_at').notNull(),
    deletedAt: text('deleted_at'),
    status: text('status').default('active'),
  },
  (table) => ({
    fileIdIdx: index('idx_file_id').on(table.fileId),
    expiresAtIdx: index('idx_expires_at').on(table.expiresAt),
    statusIdx: index('idx_status').on(table.status),
  })
);

module.exports = { files };
```

- [ ] **Step 2: Verify file exists**

```bash
test -f drizzle/schema.js && echo "File created"
```

Expected: "File created"

---

### Task 3: Create Drizzle Config

**Files:**
- Create: `drizzle/drizzle.config.js`

- [ ] **Step 1: Create drizzle config**

Create `drizzle/drizzle.config.js`:

```javascript
const path = require('path');

module.exports = {
  schema: path.resolve(__dirname, './schema.js'),
  out: path.resolve(__dirname, './migrations'),
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || path.resolve(__dirname, '../db/database.db'),
  },
};
```

- [ ] **Step 2: Verify config exists**

```bash
test -f drizzle/drizzle.config.js && echo "Config created"
```

Expected: "Config created"

---

### Task 4: Create Turso Database Client

**Files:**
- Create: `config/db.js` (new file replacing old one)

- [ ] **Step 1: Backup old db.js**

```bash
cp config/db.js config/db.js.backup
```

- [ ] **Step 2: Replace config/db.js with Turso client**

Replace the entire content of `config/db.js` with:

```javascript
const { drizzle } = require('drizzle-orm/libsql');
const { createClient } = require('@libsql/client');
const path = require('path');

/**
 * Initialize Turso/LibSQL database client
 * Supports both cloud (Turso) and local (SQLite) databases
 */
let client;

if (process.env.TURSO_CONNECTION_URL) {
  // Cloud: Use Turso
  client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  // Local: Use SQLite file for development
  client = createClient({
    url: `file:${path.resolve(__dirname, '../db/database.db')}`,
  });
}

const db = drizzle(client);

module.exports = db;
```

- [ ] **Step 3: Update .env to add TURSO_CONNECTION_URL**

Add to `.env` (create if doesn't exist):

```bash
# Database
TURSO_CONNECTION_URL=libsql://[database-name]-[org-slug].turso.io?authToken=[token]
DATABASE_URL=./db/database.db
```

Note: For now, leave TURSO_CONNECTION_URL empty; it will be set when deploying to Turso. Locally, the SQLite file will be used.

- [ ] **Step 4: Verify client can load without error**

```bash
node -e "const db = require('./config/db'); console.log('✅ DB client loaded')" 2>&1 | head -20
```

Expected: "✅ DB client loaded" (or error about missing env vars, which is OK)

---

### Task 5: Generate Initial Migration

**Files:**
- Create: `drizzle/migrations/0000_initial.sql` (auto-generated)

- [ ] **Step 1: Generate migration**

```bash
npm run drizzle:generate
```

Expected: Output shows "Migration generated successfully" and creates a new SQL file in `drizzle/migrations/`

- [ ] **Step 2: Verify migration file exists**

```bash
ls -la drizzle/migrations/ | grep .sql
```

Expected: At least one `.sql` file appears (e.g., `0000_initial.sql` or `0001_...sql`)

- [ ] **Step 3: Check migration content**

```bash
cat drizzle/migrations/*.sql
```

Expected: SQL contains `CREATE TABLE files (...)` and index definitions

- [ ] **Step 4: Commit Phase 1**

```bash
git add package.json drizzle/ config/db.js .env && git commit -m "feat: add Drizzle ORM and Turso setup

- Install drizzle-orm, @libsql/client, drizzle-kit
- Create drizzle/schema.js with files table definition
- Create drizzle/drizzle.config.js for Drizzle CLI
- Replace config/db.js with Turso/LibSQL client
- Add TURSO_CONNECTION_URL to .env
- Add npm scripts: drizzle:generate, drizzle:migrate, db:setup
- Generate initial migration

This phase sets up ORM infrastructure. No queries modified yet."
```

Expected: Commit succeeds

---

## Phase 2: Admin API

### Task 6: Migrate Admin Stats Queries

**Files:**
- Modify: `utils/dashboard.js`

- [ ] **Step 1: Update getConversionStats() in dashboard.js**

Replace the `getConversionStats` function (lines 6-58 in original):

```javascript
const { count, eq, gte, and, sql } = require('drizzle-orm');
const { files } = require('../drizzle/schema');
const db = require('../config/db');

/**
 * Fetch conversion statistics using Drizzle
 * Returns counts by time period
 */
const getConversionStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString();

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    // Total conversions
    const totalResult = await db
      .select({ count: count(files.id) })
      .from(files)
      .where(eq(files.status, 'active'));
    const total = totalResult[0]?.count || 0;

    // Today conversions
    const todayResult = await db
      .select({ count: count(files.id) })
      .from(files)
      .where(and(
        eq(files.status, 'active'),
        gte(files.createdAt, todayIso)
      ));
    const todayCount = todayResult[0]?.count || 0;

    // Yesterday conversions
    const yesterdayResult = await db
      .select({ count: count(files.id) })
      .from(files)
      .where(and(
        eq(files.status, 'active'),
        gte(files.createdAt, yesterdayIso),
        sql`${files.createdAt} < ${todayIso}`
      ));
    const yesterdayCount = yesterdayResult[0]?.count || 0;

    // Last 7 days
    const last7DaysResult = await db
      .select({ count: count(files.id) })
      .from(files)
      .where(and(
        eq(files.status, 'active'),
        gte(files.createdAt, sevenDaysAgoIso)
      ));
    const last7Days = last7DaysResult[0]?.count || 0;

    // Last 30 days
    const last30DaysResult = await db
      .select({ count: count(files.id) })
      .from(files)
      .where(and(
        eq(files.status, 'active'),
        gte(files.createdAt, thirtyDaysAgoIso)
      ));
    const last30Days = last30DaysResult[0]?.count || 0;

    return {
      total,
      today: todayCount,
      yesterday: yesterdayCount,
      last7Days,
      last30Days
    };
  } catch (error) {
    console.error('❌ Error getting conversion stats:', error.message);
    return {
      total: 0,
      today: 0,
      yesterday: 0,
      last7Days: 0,
      last30Days: 0
    };
  }
};

module.exports = { getConversionStats };
```

- [ ] **Step 2: Update remaining dashboard functions**

Update `getFormatStats()`, `getHourlyStats()`, `getFilesList()`, `getFileById()`, `getSystemStatus()`, `getDeletedFiles()` to use Drizzle instead of raw SQL:

```javascript
const { count, eq, like, desc, sql, and } = require('drizzle-orm');
const { files } = require('../drizzle/schema');
const db = require('../config/db');
const os = require('os');
const fs = require('fs');

/**
 * Format statistics using Drizzle with file extension detection
 */
const getFormatStats = async () => {
  try {
    const allFiles = await db
      .select()
      .from(files)
      .where(eq(files.status, 'active'));

    const formatCounts = {};
    const formatMap = {
      'docx': 'Word (.docx)',
      'xlsx': 'Excel (.xlsx)',
      'pptx': 'PowerPoint (.pptx)',
      'zip': 'Image (.zip)',
      'pdf': 'PDF',
      'mp3': 'MP3',
      'wav': 'WAV',
      'ogg': 'OGG',
      'm4a': 'M4A',
      'aac': 'AAC',
      'mp4': 'MP4',
      'mov': 'MOV',
      'webm': 'WebM',
      'mkv': 'MKV',
      'gif': 'GIF',
      'jpg': 'JPG',
      'png': 'PNG',
      'webp': 'WebP',
    };

    allFiles.forEach(file => {
      const ext = file.r2Path.split('.').pop().toLowerCase();
      const label = formatMap[ext] || `${ext.toUpperCase()}`;
      formatCounts[label] = (formatCounts[label] || 0) + 1;
    });

    return Object.entries(formatCounts)
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('❌ Error getting format stats:', error.message);
    return [];
  }
};

/**
 * Hourly statistics
 */
const getHourlyStats = async () => {
  try {
    const allFiles = await db
      .select()
      .from(files)
      .where(eq(files.status, 'active'));

    const hourlyData = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i, 0, 0, 0);
      const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[hourStr] = 0;
    }

    allFiles.forEach(file => {
      const fileDate = new Date(file.createdAt);
      const hourStr = fileDate.getHours().toString().padStart(2, '0') + ':00';
      if (hourlyData[hourStr] !== undefined) {
        hourlyData[hourStr]++;
      }
    });

    return Object.entries(hourlyData).map(([hour, count]) => ({ hour, count }));
  } catch (error) {
    console.error('❌ Error getting hourly stats:', error.message);
    return [];
  }
};

/**
 * File list with pagination
 */
const getFilesList = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    const filesList = await db
      .select()
      .from(files)
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: count(files.id) })
      .from(files);
    const total = countResult[0]?.count || 0;

    return {
      files: filesList,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('❌ Error getting files list:', error.message);
    return { files: [], page, limit, total: 0, pages: 0 };
  }
};

/**
 * File by ID
 */
const getFileById = async (fileId) => {
  try {
    const result = await db
      .select()
      .from(files)
      .where(eq(files.fileId, fileId));
    return result[0] || null;
  } catch (error) {
    console.error('❌ Error getting file by ID:', error.message);
    return null;
  }
};

/**
 * System status
 */
const getSystemStatus = async () => {
  try {
    const uptime = Math.floor(process.uptime());
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const dbPath = require('path').resolve(__dirname, '../db/database.db');
    const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

    return {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      cpu: {
        user: (cpuUsage.user / 1000000).toFixed(2),
        system: (cpuUsage.system / 1000000).toFixed(2)
      },
      memory: {
        rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB'
      },
      dbSize: (dbSize / 1024 / 1024).toFixed(2) + ' MB',
      loadAverage: os.loadavg().map(x => x.toFixed(2))
    };
  } catch (error) {
    console.error('❌ Error getting system status:', error.message);
    return {};
  }
};

/**
 * Deleted files
 */
const getDeletedFiles = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;

    const deletedFiles = await db
      .select()
      .from(files)
      .where(eq(files.status, 'deleted'))
      .orderBy(desc(files.deletedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: count(files.id) })
      .from(files)
      .where(eq(files.status, 'deleted'));
    const total = countResult[0]?.count || 0;

    return {
      files: deletedFiles,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('❌ Error getting deleted files:', error.message);
    return { files: [], page, limit, total: 0, pages: 0 };
  }
};

module.exports = {
  getConversionStats,
  getFormatStats,
  getHourlyStats,
  getFilesList,
  getFileById,
  getSystemStatus,
  getDeletedFiles
};
```

- [ ] **Step 3: Update adminRoutes.js to make routes async**

Update the route handlers in `routes/adminRoutes.js` to use `async/await`:

```javascript
/**
 * GET /api/admin/stats
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const conversionStats = await getConversionStats();
    const formatStats = await getFormatStats();
    const hourlyStats = await getHourlyStats();

    res.json({
      success: true,
      conversions: conversionStats,
      formats: formatStats,
      hourly: hourlyStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(withTime(`❌ 통계 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '통계 조회 실패' });
  }
});

/**
 * GET /api/admin/files
 */
router.get('/files', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getFilesList(page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(withTime(`❌ 파일 목록 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '파일 목록 조회 실패' });
  }
});

/**
 * GET /api/admin/files/:fileId
 */
router.get('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await getFileById(fileId);

    if (!file) {
      return res.status(404).json({ success: false, error: '파일을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: file });
  } catch (error) {
    console.error(withTime(`❌ 파일 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '파일 조회 실패' });
  }
});

/**
 * GET /api/admin/status
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const status = await getSystemStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error(withTime(`❌ 시스템 상태 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '시스템 상태 조회 실패' });
  }
});

/**
 * GET /api/admin/deleted
 */
router.get('/deleted', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getDeletedFiles(page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(withTime(`❌ 삭제된 파일 목록 조회 오류: ${error.message}`));
    res.status(500).json({ success: false, error: '삭제된 파일 목록 조회 실패' });
  }
});
```

- [ ] **Step 4: Run tests for admin API**

```bash
npm test -- adminRoutes.test.js --forceExit
```

Expected: Tests pass or show failures; note any failures to fix

- [ ] **Step 5: Commit Phase 2**

```bash
git add utils/dashboard.js routes/adminRoutes.js && git commit -m "feat: migrate admin API to Drizzle ORM

- Replace raw SQL queries in utils/dashboard.js with Drizzle
- Update getConversionStats, getFormatStats, getHourlyStats
- Update getFilesList, getFileById, getSystemStatus, getDeletedFiles
- Make admin routes async to support async Drizzle queries
- All admin endpoints now use parameterized Drizzle queries
- Prevents SQL injection for admin stats/list/deleted endpoints

Phase 2 complete: Admin API migrated to Drizzle."
```

---

## Phase 3: File Metadata

### Task 7: Migrate Convert Route (Insert)

**Files:**
- Modify: `routes/convertRoutes.js`

- [ ] **Step 1: Update imports in convertRoutes.js**

At the top of `routes/convertRoutes.js`, replace the old db imports with:

```javascript
const { files } = require('../drizzle/schema');
const db = require('../config/db');
```

Remove the old line:
```javascript
const { safeConversionWithTransaction, safeCleanupWithTransaction } = require('../utils/dbTransaction');
```

- [ ] **Step 2: Replace file insert in POST /api/convert**

Find the section that inserts file metadata (around line 130-150 in the original) and replace it with:

```javascript
// Insert file metadata using Drizzle
const insertResult = await db.insert(files).values({
  fileId: newFileId,
  r2Path: convertedR2Path,
  fileType: 'converted',
  expiresAt: expirationTime.toISOString(),
  status: 'active'
});

console.log(withTime(`✅ DB에 파일 정보 저장`));
```

Note: Make sure the `POST /api/convert` handler is `async`:

```javascript
router.post('/', async (req, res) => {
  // ... existing code ...
});
```

- [ ] **Step 3: Test convert endpoint**

Upload a test file and convert it. Check if file appears in database:

```bash
npm test -- convert.test.js --forceExit
```

Expected: Conversion completes and file record is created

---

### Task 8: Migrate Download Route (Select)

**Files:**
- Modify: `routes/downloadRoutes.js`

- [ ] **Step 1: Update imports**

Replace the db imports in `routes/downloadRoutes.js`:

```javascript
const { eq } = require('drizzle-orm');
const { files } = require('../drizzle/schema');
const db = require('../config/db');
```

- [ ] **Step 2: Replace file lookup query**

Find the file lookup (around line 20-30) and replace with:

```javascript
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Query file by ID using Drizzle
    const fileResult = await db
      .select()
      .from(files)
      .where(eq(files.fileId, fileId));

    const file = fileResult[0];

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // ... rest of download logic (R2 download, streaming, etc.)
  } catch (error) {
    console.error(withTime(`❌ Download error: ${error.message}`));
    res.status(500).json({ success: false, error: 'Download failed' });
  }
});
```

- [ ] **Step 3: Test download endpoint**

```bash
npm test -- download.test.js --forceExit
```

Expected: File download works correctly

- [ ] **Step 4: Commit Phase 3**

```bash
git add routes/convertRoutes.js routes/downloadRoutes.js && git commit -m "feat: migrate file metadata operations to Drizzle

- Replace raw SQL insert in POST /api/convert with Drizzle
- Replace raw SQL select in GET /api/download/:fileId with Drizzle
- Make convert and download routes async
- File inserts and lookups now use parameterized Drizzle queries

Phase 3 complete: Core file metadata operations migrated."
```

---

## Phase 4: Dashboard Aggregates

### Task 9: Dashboard Integration Test

**Files:**
- Modify: `__tests__/database.test.js` (or create new test)

- [ ] **Step 1: Run dashboard tests**

```bash
npm test -- database.test.js --forceExit
```

Expected: All dashboard stat queries pass

- [ ] **Step 2: Verify stats accuracy**

Manually test the admin dashboard (`/admin.html`) and verify stats display correctly:
- Total conversions count
- Today/7-day/30-day counts
- Format breakdown
- Hourly timeline

Expected: Stats match database content

- [ ] **Step 3: Commit Phase 4**

```bash
git add && git commit -m "test: verify dashboard aggregates work with Drizzle

- Run admin stats queries through Drizzle
- Verify counts, date ranges, format stats are accurate
- Test pagination for file list and deleted files

Phase 4 complete: Dashboard metrics verified."
```

---

## Phase 5: Scheduler

### Task 10: Migrate Scheduler Cleanup

**Files:**
- Modify: `utils/scheduler.js`

- [ ] **Step 1: Update scheduler imports**

Replace db imports in `utils/scheduler.js`:

```javascript
const { eq, lte, and } = require('drizzle-orm');
const { files } = require('../drizzle/schema');
const db = require('../config/db');
```

- [ ] **Step 2: Replace scheduler queries**

Find the cleanup logic and replace with Drizzle:

```javascript
const scheduleCleanup = () => {
  schedule.scheduleJob('*/2 * * * *', async () => {
    try {
      console.log(withTime('🔍 만료된 파일 정리 시작...'));

      const now = new Date().toISOString();

      // Select expired files
      const expiredFiles = await db
        .select()
        .from(files)
        .where(and(
          lte(files.expiresAt, now),
          eq(files.status, 'active')
        ));

      if (expiredFiles.length === 0) {
        console.log(withTime('✅ 만료된 파일 없음'));
        return;
      }

      console.log(withTime(`⏰ 만료된 파일 ${expiredFiles.length}개 발견`));

      let successCount = 0;
      let failureCount = 0;

      for (const file of expiredFiles) {
        try {
          // Delete from R2
          await deleteFromR2(file.r2Path);

          // Update status to 'deleted'
          await db
            .update(files)
            .set({ status: 'deleted', deletedAt: new Date().toISOString() })
            .where(eq(files.fileId, file.fileId));

          console.log(withTime(`🗑️  R2에서 삭제: ${file.r2Path}`));
          console.log(withTime(`✅ 완료: ${file.fileId}`));
          successCount++;
        } catch (error) {
          console.error(withTime(`❌ 정리 실패 (${file.fileId}): ${error.message}`));
          failureCount++;
        }
      }

      console.log(withTime(`🎉 정리 완료 (${successCount}건 성공, ${failureCount}건 실패)`));
    } catch (error) {
      console.error(withTime(`❌ 정리 중 오류: ${error.message}`));
    }
  });
};

module.exports = { scheduleCleanup };
```

- [ ] **Step 3: Test scheduler**

Manually trigger scheduler and verify cleanup:

```bash
# Check files marked as 'deleted' in DB
npm test -- database.test.js --forceExit
```

Expected: Expired files are marked as deleted and removed from R2

- [ ] **Step 4: Commit Phase 5**

```bash
git add utils/scheduler.js && git commit -m "feat: migrate scheduler cleanup to Drizzle

- Replace raw SQL select/update in utils/scheduler.js with Drizzle
- Query expired files with lte(expires_at) and eq(status, 'active')
- Update status to 'deleted' with Drizzle instead of raw SQL
- Cleanup now uses parameterized Drizzle queries

Phase 5 complete: Full migration to Drizzle ORM."
```

---

## Final Integration Testing

### Task 11: End-to-End Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --forceExit --detectOpenHandles
```

Expected: All tests pass

- [ ] **Step 2: Manual flow test**

1. Upload a file (e.g., PDF)
2. Convert to another format (e.g., Word)
3. Download the converted file
4. Check admin dashboard stats
5. Wait 10+ minutes for file to expire
6. Verify scheduler deleted expired file

Expected: Complete flow works end-to-end

- [ ] **Step 3: SQL injection test**

Try uploading a file with SQL injection in filename:
```
test'; DROP TABLE files; --.pdf
```

Expected: File uploads successfully with sanitized filename; no SQL error

- [ ] **Step 4: Final commit**

```bash
git add && git commit -m "test: complete Turso + Drizzle migration

- All routes use Drizzle ORM with parameterized queries
- No raw SQL in application code (except migrations)
- SQL injection vulnerability eliminated
- All tests pass: admin, convert, download, scheduler
- End-to-end flow verified: upload → convert → download → cleanup

Migration complete: better-sqlite3 → Turso + Drizzle ORM"
```

---

## Verification Checklist

Before considering this complete:

- ✅ All npm dependencies installed (`drizzle-orm`, `@libsql/client`, `drizzle-kit`)
- ✅ `config/db.js` initializes Turso/LibSQL client
- ✅ `drizzle/schema.js` defines files table
- ✅ `drizzle/migrations/` contains SQL migration file
- ✅ `utils/dashboard.js` uses Drizzle queries (async)
- ✅ `routes/adminRoutes.js` makes all handlers async and uses dashboard functions
- ✅ `routes/convertRoutes.js` inserts file metadata with Drizzle
- ✅ `routes/downloadRoutes.js` queries file with Drizzle
- ✅ `utils/scheduler.js` cleans up with Drizzle delete/update
- ✅ All Jest tests pass
- ✅ No raw SQL strings in application code
- ✅ API response formats unchanged (backwards compatible)
- ✅ File metadata is persisted and retrieved correctly
- ✅ Cleanup task deletes expired files

---

## Rollback Plan

If a phase fails:

1. Revert the phase commit: `git revert HEAD`
2. Fix the underlying issue
3. Retry the phase

Example: If Phase 2 breaks admin API:
```bash
git revert HEAD
# Fix adminRoutes.js or dashboard.js
git add .
git commit -m "fix: admin API async/await issues"
```

All prior phases remain intact and functional.