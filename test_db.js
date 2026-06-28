const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query('SELECT * FROM movement_logs LIMIT 5');
    console.log(res.rows);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await pool.end();
  }
}
run();
