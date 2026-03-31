const path = require('path');

module.exports = {
  schema: path.resolve(__dirname, './schema.js'),
  out: path.resolve(__dirname, './migrations'),
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || path.resolve(__dirname, '../db/database.db'),
  },
};
