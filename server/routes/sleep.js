const router = require('express').Router();
const prisma = require('../prisma');
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
router.post('/', async (req, res) => {
  try {
    const { bedtime, wake_time, quality = 3 } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    if (quality !== null && quality !== undefined && (Number(quality) < 1 || Number(quality) > 5)) {
      return res.status(400).json({ error: 'Sleep quality must be between 1 and 5.' });
    }

    const duration_hours = calcDuration(bedtime, wake_time);

    const log = await prisma.sleepLog.upsert({
      where: {
        user_id_date: {
          user_id: Number(req.user.id),
          date: date,
        }
      },
      update: { bedtime, wake_time, duration_hours, quality },
      create: {
        user_id: Number(req.user.id),
        date: date,
        bedtime,
        wake_time,
        duration_hours,
        quality,
      }
    });

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log sleep.' });
  }
});

// GET /api/sleep?range=week|month
router.get('/', async (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = await prisma.sleepLog.findMany({
      where: {
        user_id: Number(req.user.id),
        date: { gte: start }
      },
      orderBy: { date: 'asc' }
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sleep history.' });
  }
});

module.exports = router;
