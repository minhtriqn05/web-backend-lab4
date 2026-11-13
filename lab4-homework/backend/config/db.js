// config/db.js - MySQL connection pool + automatic table creation
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const pool = mysql.createPool({
  host: DB_HOST || 'localhost',
  port: Number(DB_PORT) || 3306,
  user: DB_USER || 'root',
  password: DB_PASSWORD || '',
  database: DB_NAME || 'lab4_shop',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true // return DECIMAL columns (price) as numbers, not strings
});

// Create the database (if needed) and the 3 tables from schema.sql
async function initDatabase() {
  const dbName = DB_NAME || 'lab4_shop';

  // 1. connect without a database to be able to CREATE DATABASE
  const conn = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: Number(DB_PORT) || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || ''
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  // 2. run every CREATE TABLE statement of schema.sql
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    .split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`MySQL connected - database "${dbName}" is ready`);
}

module.exports = { pool, initDatabase };
