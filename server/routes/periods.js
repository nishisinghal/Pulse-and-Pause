const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get period logs for the last 12 months
router.get('/', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT date, flow 
      FROM period_logs 
      WHERE user_id = ? 
        AND date >= date('now', '-12 months')
      ORDER BY date DESC
    `).all(req.user.id);

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark/Update a period date
router.post('/', (req, res) => {
  const { date, flow } = req.body;
  if (!date || !['light', 'normal', 'heavy'].includes(flow)) {
    return res.status(400).json({ error: 'Invalid date or flow' });
  }

  try {
    db.prepare(`
      INSERT INTO period_logs (user_id, date, flow)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET flow = excluded.flow
    `).run(req.user.id, date, flow);

    res.json({ message: 'Saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unmark a period date
router.delete('/:date', (req, res) => {
  try {
    db.prepare(`
      DELETE FROM period_logs 
      WHERE user_id = ? AND date = ?
    `).run(req.user.id, req.params.date);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
