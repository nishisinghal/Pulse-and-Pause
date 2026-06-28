const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

function getQuota(gender) {
  return gender === 'female' ? 5 : 4;
}

// POST /api/restdays — mark today as rest day
router.post('/', async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const month = date.substring(0, 7); // YYYY-MM

    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { gender: true }
    });
    const quota = getQuota(user.gender);

    const usedCount = await prisma.restDay.count({
      where: { user_id: Number(req.user.id), month }
    });

    if (usedCount >= quota) {
      return res.status(400).json({
        error: `Rest day quota exceeded. You have ${quota} rest days per month.`,
        used: usedCount,
        total: quota
      });
    }

    await prisma.restDay.upsert({
      where: {
        user_id_date: { user_id: Number(req.user.id), date }
      },
      update: {},
      create: {
        user_id: Number(req.user.id),
        date,
        month
      }
    });

    const newUsed = await prisma.restDay.count({
      where: { user_id: Number(req.user.id), month }
    });

    res.json({ date, remaining: quota - newUsed, total: quota, used: newUsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark rest day.' });
  }
});

// DELETE /api/restdays/:date — unmark rest day
router.delete('/:date', async (req, res) => {
  try {
    await prisma.restDay.deleteMany({
      where: {
        user_id: Number(req.user.id),
        date: req.params.date
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unmark rest day.' });
  }
});

// GET /api/restdays?month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().substring(0, 7);

    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { gender: true }
    });
    const quota = getQuota(user.gender);

    const days = await prisma.restDay.findMany({
      where: { user_id: Number(req.user.id), month },
      orderBy: { date: 'asc' }
    });

    res.json({ days, used: days.length, remaining: quota - days.length, total: quota });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rest days.' });
  }
});

module.exports = router;
