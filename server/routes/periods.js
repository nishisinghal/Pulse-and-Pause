const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get period logs for the last 12 months
router.get('/', async (req, res) => {
  try {
    const dateOffset = new Date();
    dateOffset.setMonth(dateOffset.getMonth() - 12);
    const startStr = dateOffset.toISOString().split('T')[0];

    const logs = await prisma.periodLog.findMany({
      where: {
        user_id: Number(req.user.id),
        date: { gte: startStr }
      },
      select: { date: true, flow: true },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark/Update a period date
router.post('/', async (req, res) => {
  const { date, flow } = req.body;
  if (!date || !['light', 'normal', 'heavy'].includes(flow)) {
    return res.status(400).json({ error: 'Invalid date or flow' });
  }

  try {
    await prisma.periodLog.upsert({
      where: {
        user_id_date: {
          user_id: Number(req.user.id),
          date: date,
        }
      },
      update: { flow },
      create: {
        user_id: Number(req.user.id),
        date: date,
        flow,
      }
    });

    res.json({ message: 'Saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unmark a period date
router.delete('/:date', async (req, res) => {
  try {
    await prisma.periodLog.deleteMany({
      where: {
        user_id: Number(req.user.id),
        date: req.params.date,
      }
    });

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
