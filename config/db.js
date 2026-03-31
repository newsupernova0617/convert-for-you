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
