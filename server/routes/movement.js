const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/movement — log or update today's movement
router.post('/', (req, res) => {
  try {
    const { steps = 0, active_minutes = 0, workout_type = '', workout_duration = 0 } = req.body;
    const date = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO movement_logs (user_id, date, steps, active_minutes, workout_type, workout_duration)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        steps = movement_logs.steps + excluded.steps,
        active_minutes = movement_logs.active_minutes + excluded.active_minutes,
        workout_type = CASE WHEN excluded.workout_type != '' THEN excluded.workout_type ELSE movement_logs.workout_type END,
        workout_duration = movement_logs.workout_duration + excluded.workout_duration
    `).run(req.user.id, date, steps, active_minutes, workout_type, workout_duration);

    const log = db.prepare('SELECT * FROM movement_logs WHERE user_id = ? AND date = ?').get(req.user.id, date);
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log movement.' });
  }
});

// GET /api/movement?range=week|month
router.get('/', (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = db.prepare(
      'SELECT * FROM movement_logs WHERE user_id = ? AND date >= ? ORDER BY date ASC'
    ).all(req.user.id, start);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movement history.' });
  }
});

module.exports = router;
