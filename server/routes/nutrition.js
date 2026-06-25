const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/nutrition
router.post('/', (req, res) => {
  try {
    const {
      breakfast = 0, lunch = 0, snacks = 0, dinner = 0,
      breakfast_note = '', lunch_note = '', snacks_note = '', dinner_note = '',
      water_glasses = 0
    } = req.body;
    const date = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO nutrition_logs (user_id, date, breakfast, lunch, snacks, dinner,
        breakfast_note, lunch_note, snacks_note, dinner_note, water_glasses)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        breakfast = excluded.breakfast, lunch = excluded.lunch,
        snacks = excluded.snacks, dinner = excluded.dinner,
        breakfast_note = excluded.breakfast_note, lunch_note = excluded.lunch_note,
        snacks_note = excluded.snacks_note, dinner_note = excluded.dinner_note,
        water_glasses = excluded.water_glasses
    `).run(req.user.id, date, breakfast ? 1 : 0, lunch ? 1 : 0, snacks ? 1 : 0, dinner ? 1 : 0,
      breakfast_note, lunch_note, snacks_note, dinner_note, water_glasses);

    const log = db.prepare('SELECT * FROM nutrition_logs WHERE user_id = ? AND date = ?').get(req.user.id, date);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log nutrition.' });
  }
});

// GET /api/nutrition?range=week|month
router.get('/', (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = db.prepare(
      'SELECT * FROM nutrition_logs WHERE user_id = ? AND date >= ? ORDER BY date ASC'
    ).all(req.user.id, start);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition history.' });
  }
});

module.exports = router;
