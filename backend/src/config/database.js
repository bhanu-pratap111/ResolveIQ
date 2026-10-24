
const mysql = require('mysql2/promise');
require('dotenv').config();

const useSSL = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'resolveiq_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: useSSL
    ? { ca: process.env.AIVEN_CA_CERT }
    : undefined,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: 'Z',
  decimalNumbers: true,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
