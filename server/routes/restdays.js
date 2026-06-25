const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function getQuota(gender) {
  return gender === 'female' ? 5 : 4;
}

// POST /api/restdays — mark today as rest day
router.post('/', (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const month = date.substring(0, 7); // YYYY-MM

    const user = db.prepare('SELECT gender FROM users WHERE id = ?').get(req.user.id);
    const quota = getQuota(user.gender);

    const usedCount = db.prepare(
      'SELECT COUNT(*) as count FROM rest_days WHERE user_id = ? AND month = ?'
    ).get(req.user.id, month).count;

    if (usedCount >= quota) {
      return res.status(400).json({
        error: `Rest day quota exceeded. You have ${quota} rest days per month.`,
        used: usedCount,
        total: quota
      });
    }

    db.prepare(`
      INSERT OR IGNORE INTO rest_days (user_id, date, month) VALUES (?, ?, ?)
    `).run(req.user.id, date, month);

    const newUsed = db.prepare(
      'SELECT COUNT(*) as count FROM rest_days WHERE user_id = ? AND month = ?'
    ).get(req.user.id, month).count;

    res.json({ date, remaining: quota - newUsed, total: quota, used: newUsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark rest day.' });
  }
});

// DELETE /api/restdays/:date — unmark rest day
router.delete('/:date', (req, res) => {
  try {
    db.prepare('DELETE FROM rest_days WHERE user_id = ? AND date = ?').run(req.user.id, req.params.date);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unmark rest day.' });
  }
});

// GET /api/restdays?month=YYYY-MM
router.get('/', (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);

    const user = db.prepare('SELECT gender FROM users WHERE id = ?').get(req.user.id);
    const quota = getQuota(user.gender);

    const days = db.prepare(
      'SELECT * FROM rest_days WHERE user_id = ? AND month = ? ORDER BY date ASC'
    ).all(req.user.id, month);

    res.json({ days, used: days.length, remaining: quota - days.length, total: quota });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rest days.' });
  }
});

module.exports = router;
