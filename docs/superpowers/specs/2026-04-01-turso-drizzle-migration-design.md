# Turso + Drizzle ORM Migration Design

**Date:** 2026-04-01  
**Project:** Convert4U Media Conversion Platform  
**Goal:** Replace better-sqlite3 + raw SQL with Turso + Drizzle ORM for SQL injection prevention and improved developer experience

---

## Executive Summary

Migrate from `better-sqlite3` (local SQLite) to **Turso** (managed SQLite-compatible database) + **Drizzle ORM** (JavaScript query builder). This eliminates raw SQL strings, prevents SQL injection through automatic parameterization, and improves code maintainability with type-safe queries.

**Scope:** 1:1 schema migration (no new tables/fields), JavaScript codebase (no TypeScript)

**Rollout:** Phased by feature — Admin API → File Metadata → Dashboard → Scheduler

---

## Current State

### Database Setup
- **Client:** `better-sqlite3` (synchronous, in-process SQLite)
- **Database:** Local file-based SQLite (`db/database.db`)
- **Schema:** Single `files` table (file metadata only)
- **Queries:** Raw SQL strings with manual parameterization

### Schema
```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT UNIQUE NOT NULL,
  r2_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  deleted_at DATETIME,
  status TEXT DEFAULT 'active'
);

CREATE INDEX idx_file_id ON files(file_id);
CREATE INDEX idx_expires_at ON files(expires_at);
CREATE INDEX idx_status ON files(status);
```

### Query Patterns
- **Insert:** `/api/convert` creates file record after upload
- **Select:** `/api/download` queries by `file_id`; admin API queries with filters
- **Update:** `/api/admin/*` updates file status
- **Delete:** `scheduler.js` deletes expired records
- **Aggregates:** `dashboard.js` counts by status, format, date ranges

---

## Target State

### Database Setup
- **Client:** Turso (`@libsql/client`) — managed SQLite-compatible service
- **Database:** Cloud-hosted (Turso) with connection string in `.env`
- **Schema:** Identical to current (1:1 migration)
- **Queries:** Drizzle ORM query builder (parameterized, type-safe)

### Architecture Layers

**1. Config Layer** (`config/db.js`)
```javascript
// Turso client initialization and connection management
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
});
module.exports = client;
```

**2. Schema Layer** (`drizzle/schema.js`)
```javascript
// Drizzle table definitions (mirrors current schema)
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: text('file_id').unique().notNull(),
  r2Path: text('r2_path').notNull(),
  fileType: text('file_type').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text('expires_at').notNull(),
  deletedAt: text('deleted_at'),
  status: text('status').default('active'),
});
```

**3. Migration Layer** (`drizzle/migrations/`)
- Drizzle generates migration files from schema changes
- Migrations are version-controlled and atomic
- Run migrations once on deployment

**4. Query Layer** (route handlers and utils)
```javascript
// Before (raw SQL):
const stmt = db.prepare(`SELECT * FROM files WHERE file_id = ?`);
const file = stmt.get(fileId);

// After (Drizzle):
const file = await db.select().from(files).where(eq(files.fileId, fileId)).get();
```

---

## Phased Rollout Strategy

### Phase 1: Setup
1. Install dependencies (`drizzle-orm`, `@libsql/client`)
2. Create `config/db.js` with Turso client
3. Create `drizzle/schema.js` with table definitions
4. Create `drizzle/drizzle.config.js` for Drizzle CLI
5. Generate initial migration from schema
6. Test connection to Turso (manual or via integration test)
7. **Validation:** `npm run drizzle -- info` shows schema

### Phase 2: Admin API
Migrate `/api/admin/*` routes — lowest risk, isolated from core conversion flow.

**Routes affected:**
- `POST /api/admin/login` — read `ADMIN_PASSWORD` (no DB query change)
- `POST /api/admin/refresh` — JWT token handling (no DB query change)
- `GET /api/admin/stats` — read-only aggregates → Drizzle `count()`, `where()`
- `GET /api/admin/files` — read-only list with pagination → Drizzle `select().where().offset().limit()`
- `GET /api/admin/files/:fileId` — read-only by ID → Drizzle `select().where()`
- `GET /api/admin/status` — system metrics (no DB query change)
- `GET /api/admin/deleted` — read-only deleted files → Drizzle `select().where(status)`

**Dependencies:** None (isolated from other routes)

**Testing:** Existing Jest tests updated to mock Drizzle responses instead of raw SQL

### Phase 3: File Metadata
Migrate file operations in core conversion flow.

**Routes affected:**
- `POST /api/convert` — insert file record → Drizzle `insert()`
- `GET /api/download/:fileId` — query by file_id → Drizzle `select().where()`

**Dependencies:** Phase 2 must be complete (shared DB client)

**Testing:** End-to-end: upload file → convert → download, verify file metadata in DB

### Phase 4: Dashboard & Stats
Migrate aggregate queries in `utils/dashboard.js`.

**Operations:**
- Count by status (`active`, `deleted`, `failed`)
- Count by date range (today, 7 days, 30 days)
- Count by format type
- Timeline aggregates

**Dependencies:** Phase 2 and 3 (all queries must be migrated first)

**Testing:** Admin dashboard API tests verify stats match expected values

### Phase 5: Scheduler
Migrate cleanup task in `utils/scheduler.js`.

**Operations:**
- Select expired files → Drizzle `select().where()`
- Delete expired files → Drizzle `delete().where()`
- Update status to 'deleted' → Drizzle `update().set().where()`

**Dependencies:** All prior phases

**Testing:** Run scheduler, verify expired files are marked as deleted, not removed (since we're using soft deletes)

---

## Query Translation Examples

### Insert (Phase 3)
**Before:**
```javascript
const stmt = db.prepare(`
  INSERT INTO files (file_id, r2_path, file_type, expires_at, status)
  VALUES (?, ?, ?, ?, ?)
`);
stmt.run(fileId, r2Path, fileType, expiresAt, status);
```

**After:**
```javascript
await db.insert(files).values({
  fileId,
  r2Path,
  fileType,
  expiresAt,
  status,
});
```

### Select with Filter (Phase 2, 3, 4)
**Before:**
```javascript
const stmt = db.prepare(`SELECT * FROM files WHERE status = ? LIMIT ? OFFSET ?`);
const results = stmt.all(status, limit, offset);
```

**After:**
```javascript
const results = await db
  .select()
  .from(files)
  .where(eq(files.status, status))
  .limit(limit)
  .offset(offset);
```

### Count (Phase 4)
**Before:**
```javascript
const stmt = db.prepare(`SELECT COUNT(*) as count FROM files WHERE status = ?`);
const { count } = stmt.get(status);
```

**After:**
```javascript
const result = await db
  .select({ count: count(files.id) })
  .from(files)
  .where(eq(files.status, status));
const count = result[0]?.count || 0;
```

### Delete with Condition (Phase 5)
**Before:**
```javascript
const stmt = db.prepare(`DELETE FROM files WHERE expires_at <= ? AND status = 'active'`);
const result = stmt.run(new Date());
```

**After:**
```javascript
const result = await db
  .delete(files)
  .where(and(
    lte(files.expiresAt, new Date().toISOString()),
    eq(files.status, 'active')
  ));
```

---

## Dependencies & Configuration

### New npm Packages
```json
{
  "dependencies": {
    "drizzle-orm": "^0.30.0+",
    "@libsql/client": "^0.5.0+"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0+"
  }
}
```

### Environment Variables
```bash
# Add to .env
TURSO_CONNECTION_URL=libsql://[database-name]-[org-slug].turso.io?authToken=[token]
```

### npm Scripts
```json
{
  "scripts": {
    "drizzle:generate": "drizzle-kit generate:sqlite --config drizzle/drizzle.config.js",
    "drizzle:migrate": "drizzle-kit migrate:sqlite --config drizzle/drizzle.config.js",
    "db:setup": "npm run drizzle:generate && npm run drizzle:migrate"
  }
}
```

---

## File Structure Changes

```
convert-for-you/
├── config/
│   ├── db.js                    # NEW: Turso client initialization
│   ├── auth.js                  # (unchanged)
│   ├── r2.js                    # (unchanged)
│   └── rateLimiter.js           # (unchanged)
├── drizzle/
│   ├── schema.js                # NEW: Drizzle table definitions
│   ├── drizzle.config.js        # NEW: Drizzle CLI configuration
│   └── migrations/              # NEW: Auto-generated migration files
│       └── 0000_initial.sql     # (Drizzle-generated)
├── routes/
│   ├── adminRoutes.js           # MODIFIED: Drizzle queries
│   ├── convertRoutes.js         # MODIFIED: Drizzle insert
│   ├── downloadRoutes.js        # MODIFIED: Drizzle select
│   └── uploadRoutes.js          # (unchanged)
├── utils/
│   ├── dashboard.js             # MODIFIED: Drizzle aggregates
│   ├── scheduler.js             # MODIFIED: Drizzle delete/update
│   ├── dbTransaction.js         # DEPRECATED: Drizzle handles transactions
│   ├── logger.js                # (unchanged)
│   ├── sanitizer.js             # (unchanged)
│   └── converters/              # (unchanged)
├── __tests__/
│   ├── adminRoutes.test.js      # MODIFIED: Mock Drizzle responses
│   ├── download.test.js         # MODIFIED: Mock Drizzle responses
│   ├── database.test.js         # MODIFIED: Test Drizzle client
│   └── ...                      # (other tests unchanged)
├── package.json                 # MODIFIED: Add drizzle deps
├── .env                         # MODIFIED: Add TURSO_CONNECTION_URL
└── CLAUDE.md                    # (updated reference docs)
```

---

## Error Handling

### Connection Errors
Drizzle throws errors on invalid connections. Wrap DB operations in try/catch:
```javascript
try {
  const result = await db.select().from(files).where(...);
} catch (error) {
  logger.error(`Database query failed: ${error.message}`);
  throw new Error('Internal server error');
}
```

### Migration Errors
If a migration fails, Drizzle rolls back automatically. Check migration status:
```bash
npm run drizzle:info
```

### SQL Injection
Drizzle parameterizes all queries automatically — no user input can break SQL syntax.

---

## Testing Strategy

### Unit Tests (Jest)
- Mock Drizzle client in tests using `jest.mock('drizzle-orm')`
- Update existing tests to expect Drizzle response format (if different from raw SQL)
- Add integration tests for each phase to verify end-to-end flow

### Integration Tests
- After each phase, run full conversion flow (upload → convert → download) to verify file metadata is persisted
- Admin API tests verify stats aggregates are correct
- Scheduler test verifies expired files are cleaned up

### Manual Testing
- Create a test account on Turso
- Deploy to staging, upload a file, verify in Turso dashboard
- Run scheduler, verify cleanup works

---

## Backwards Compatibility & Rollback

### During Migration
- No API response changes (same JSON structure)
- No breaking changes to route contracts
- Existing frontend code requires no changes

### Rollback Plan
If critical issues occur after a phase:
1. Revert the phase commit
2. Keep previous phases (backward-compatible)
3. Debug and retry the problematic phase

Example: If Phase 2 (Admin API) breaks, revert Phase 2 only; keep setup and everything else.

---

## Success Criteria

- ✅ All SQL strings replaced with Drizzle queries
- ✅ Zero raw SQL in application code (except migrations)
- ✅ SQL injection vulnerability eliminated
- ✅ All existing tests pass with Drizzle mocks
- ✅ Admin dashboard shows same stats as before
- ✅ File upload → convert → download flow works end-to-end
- ✅ Scheduler deletes expired files correctly
- ✅ No API response structure changes
- ✅ Production deployment with Turso succeeds

---

## Timeline & Effort

| Phase | Tasks | Effort |
|-------|-------|--------|
| Setup | Install, config, schema, initial migration | ~1-2 hours |
| Phase 1 (Admin) | Migrate 7 routes, update tests | ~2-3 hours |
| Phase 2 (File Metadata) | Migrate 2 routes, insert/select | ~1-2 hours |
| Phase 3 (Dashboard) | Migrate aggregate queries | ~1 hour |
| Phase 4 (Scheduler) | Migrate cleanup task | ~30 min |
| **Total** | | ~6-8 hours |

---

## References

- **Turso:** https://turso.tech/ (SQLite hosting)
- **Drizzle ORM:** https://orm.drizzle.team/ (JavaScript ORM)
- **Drizzle SQLite:** https://orm.drizzle.team/docs/get-started-sqlite (setup guide)
- **LibSQL Client:** https://github.com/libsql/libsql-client-js (Turso JS client)
- **Drizzle Migrations:** https://orm.drizzle.team/docs/migrations (migration docs)

