const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/movement — log or update today's movement
router.post('/', async (req, res) => {
  try {
    const { steps = 0, distance_km = 0, workout_type = '', workout_duration = 0 } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    if (Number(steps) < 0 || Number(steps) > 100000) {
      return res.status(400).json({ error: 'Steps must be between 0 and 100,000.' });
    }
    if (Number(distance_km) < 0 || Number(distance_km) > 200) {
      return res.status(400).json({ error: 'Distance must be between 0 and 200 km.' });
    }
    if (Number(workout_duration) < 0 || Number(workout_duration) > 1440) {
      return res.status(400).json({ error: 'Workout duration must be between 0 and 1440 minutes.' });
    }

    const existing = await prisma.movementLog.findUnique({
      where: { user_id_date: { user_id: Number(req.user.id), date } }
    });

    if (existing) {
      await prisma.movementLog.update({
        where: { id: existing.id },
        data: {
          steps: existing.steps + Number(steps),
          distance_km: existing.distance_km + Number(distance_km),
          workout_type: workout_type !== '' ? workout_type : existing.workout_type,
          workout_duration: existing.workout_duration + Number(workout_duration)
        }
      });
    } else {
      await prisma.movementLog.create({
        data: {
          user_id: Number(req.user.id),
          date,
          steps: Number(steps),
          distance_km: Number(distance_km),
          workout_type,
          workout_duration: Number(workout_duration)
        }
      });
    }

    const log = await prisma.movementLog.findUnique({
      where: { user_id_date: { user_id: Number(req.user.id), date } }
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log movement.' });
  }
});

// GET /api/movement?range=week|month
router.get('/', async (req, res) => {
  try {
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    const logs = await prisma.movementLog.findMany({
      where: {
        user_id: Number(req.user.id),
        date: { gte: start }
      },
      orderBy: { date: 'asc' }
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movement history.' });
  }
});

module.exports = router;
