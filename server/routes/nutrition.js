const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/nutrition
router.post('/', async (req, res) => {
  try {
    const {
      breakfast = 0, lunch = 0, snacks = 0, dinner = 0,
      breakfast_note = '', lunch_note = '', snacks_note = '', dinner_note = '',
      water_glasses = 0
    } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    if (Number(water_glasses) < 0 || Number(water_glasses) > 30) {
      return res.status(400).json({ error: 'Water glasses must be between 0 and 30.' });
    }

    const log = await prisma.nutritionLog.upsert({
      where: {
        user_id_date: {
          user_id: Number(req.user.id),
          date: date,
        }
      },
      update: {
        breakfast: breakfast ? 1 : 0,
        lunch: lunch ? 1 : 0,
        snacks: snacks ? 1 : 0,
        dinner: dinner ? 1 : 0,
        breakfast_note,
        lunch_note,
        snacks_note,
        dinner_note,
        water_glasses,
      },
      create: {
        user_id: Number(req.user.id),
        date: date,
        breakfast: breakfast ? 1 : 0,
        lunch: lunch ? 1 : 0,
        snacks: snacks ? 1 : 0,
        dinner: dinner ? 1 : 0,
        breakfast_note,
        lunch_note,
        snacks_note,
        dinner_note,
        water_glasses,
      }
    });

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log nutrition.' });
  }
});

// GET /api/nutrition?range=week|month
router.get('/', async (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = await prisma.nutritionLog.findMany({
      where: {
        user_id: Number(req.user.id),
        date: { gte: start }
      },
      orderBy: { date: 'asc' }
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nutrition history.' });
  }
});

module.exports = router;
