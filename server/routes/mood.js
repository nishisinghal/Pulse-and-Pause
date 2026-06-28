const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/mood
router.post('/', async (req, res) => {
  try {
    const { mood, note = '' } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    if (!['great', 'good', 'okay', 'low', 'bad'].includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood value.' });
    }

    const log = await prisma.moodLog.upsert({
      where: {
        user_id_date: {
          user_id: Number(req.user.id),
          date: date,
        }
      },
      update: { mood, note },
      create: {
        user_id: Number(req.user.id),
        date: date,
        mood,
        note,
      }
    });

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log mood.' });
  }
});

// GET /api/mood?range=week|month
router.get('/', async (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = await prisma.moodLog.findMany({
      where: {
        user_id: Number(req.user.id),
        date: { gte: start }
      },
      orderBy: { date: 'asc' }
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mood history.' });
  }
});

module.exports = router;
