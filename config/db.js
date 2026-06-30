const mysql = require('mysql2/promise');
require('dotenv').config();

// Connection pool for performance & concurrency
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'library_db',
  port:     parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone: '+05:30',   // IST
});

// Test connection on startup
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected — database:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
