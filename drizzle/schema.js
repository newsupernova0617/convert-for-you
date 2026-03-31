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
