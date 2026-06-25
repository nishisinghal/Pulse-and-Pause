const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/mood
router.post('/', (req, res) => {
  try {
    const { mood, note = '' } = req.body;
    const date = new Date().toISOString().split('T')[0];

    if (!['great', 'good', 'okay', 'low', 'bad'].includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood value.' });
    }

    db.prepare(`
      INSERT INTO mood_logs (user_id, date, mood, note)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        mood = excluded.mood, note = excluded.note
    `).run(req.user.id, date, mood, note);

    const log = db.prepare('SELECT * FROM mood_logs WHERE user_id = ? AND date = ?').get(req.user.id, date);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log mood.' });
  }
});

// GET /api/mood?range=week|month
router.get('/', (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = db.prepare(
      'SELECT * FROM mood_logs WHERE user_id = ? AND date >= ? ORDER BY date ASC'
    ).all(req.user.id, start);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mood history.' });
  }
});

module.exports = router;
