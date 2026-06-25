const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function calcDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60; // crossed midnight
  return Math.round(((wakeMin - bedMin) / 60) * 10) / 10;
}

// POST /api/sleep
router.post('/', (req, res) => {
  try {
    const { bedtime, wake_time, quality = 3 } = req.body;
    const date = new Date().toISOString().split('T')[0];
    const duration_hours = calcDuration(bedtime, wake_time);

    db.prepare(`
      INSERT INTO sleep_logs (user_id, date, bedtime, wake_time, duration_hours, quality)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        bedtime = excluded.bedtime,
        wake_time = excluded.wake_time,
        duration_hours = excluded.duration_hours,
        quality = excluded.quality
    `).run(req.user.id, date, bedtime, wake_time, duration_hours, quality);

    const log = db.prepare('SELECT * FROM sleep_logs WHERE user_id = ? AND date = ?').get(req.user.id, date);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log sleep.' });
  }
});

// GET /api/sleep?range=week|month
router.get('/', (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = db.prepare(
      'SELECT * FROM sleep_logs WHERE user_id = ? AND date >= ? ORDER BY date ASC'
    ).all(req.user.id, start);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sleep history.' });
  }
});

module.exports = router;
