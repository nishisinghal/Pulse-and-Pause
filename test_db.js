const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const users = await pool.query('SELECT id, email FROM "User"');
    console.log('Users:', users.rows);
    
    for (const u of users.rows) {
      console.log(`\n--- User ${u.id} (${u.email}) ---`);
      const move = await pool.query('SELECT date FROM movement_logs WHERE user_id = $1', [u.id]);
      console.log('Movement Dates:', move.rows.map(r=>r.date));
      const sleep = await pool.query('SELECT date FROM sleep_logs WHERE user_id = $1', [u.id]);
      console.log('Sleep Dates:', sleep.rows.map(r=>r.date));
      const nut = await pool.query('SELECT date FROM nutrition_logs WHERE user_id = $1', [u.id]);
      console.log('Nutrition Dates:', nut.rows.map(r=>r.date));
      const mood = await pool.query('SELECT date FROM mood_logs WHERE user_id = $1', [u.id]);
      console.log('Mood Dates:', mood.rows.map(r=>r.date));
      const rest = await pool.query('SELECT date FROM rest_days WHERE user_id = $1', [u.id]);
      console.log('Rest Dates:', rest.rows.map(r=>r.date));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
