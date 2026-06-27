const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/reports?range=week|month
router.get('/', async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    // Movement stats
    const movementAgg = await prisma.movementLog.aggregate({
      where: { user_id: userId, date: { gte: start } },
      _count: { _all: true },
      _avg: { steps: true, active_minutes: true },
      _max: { steps: true }
    });

    const movement = {
      logged_days: movementAgg._count._all || 0,
      avg_steps: movementAgg._avg.steps || 0,
      avg_active_minutes: movementAgg._avg.active_minutes || 0,
      max_steps: movementAgg._max.steps || 0
    };

    // Sleep stats
    const sleepAgg = await prisma.sleepLog.aggregate({
      where: { user_id: userId, date: { gte: start } },
      _count: { _all: true },
      _avg: { duration_hours: true, quality: true },
      _min: { duration_hours: true },
      _max: { duration_hours: true }
    });

    const sleep = {
      logged_days: sleepAgg._count._all || 0,
      avg_hours: sleepAgg._avg.duration_hours || 0,
      avg_quality: sleepAgg._avg.quality || 0,
      min_hours: sleepAgg._min.duration_hours || 0,
      max_hours: sleepAgg._max.duration_hours || 0
    };

    // Nutrition stats
    const nutritionAgg = await prisma.nutritionLog.aggregate({
      where: { user_id: userId, date: { gte: start } },
      _count: { _all: true },
      _sum: { breakfast: true, lunch: true, snacks: true, dinner: true },
      _avg: { water_glasses: true }
    });

    const nutrition = {
      logged_days: nutritionAgg._count._all || 0,
      breakfast_count: nutritionAgg._sum.breakfast || 0,
      lunch_count: nutritionAgg._sum.lunch || 0,
      snacks_count: nutritionAgg._sum.snacks || 0,
      dinner_count: nutritionAgg._sum.dinner || 0,
      avg_water: nutritionAgg._avg.water_glasses || 0
    };

    const totalMeals = nutrition.logged_days * 4;
    const eatenMeals = nutrition.breakfast_count + nutrition.lunch_count + nutrition.snacks_count + nutrition.dinner_count;
    const mealConsistency = totalMeals > 0 ? Math.round((eatenMeals / totalMeals) * 100) : 0;

    // Mood stats
    const moods = await prisma.moodLog.groupBy({
      by: ['mood'],
      where: { user_id: userId, date: { gte: start } },
      _count: { _all: true }
    });

    const moodDist = { great: 0, good: 0, okay: 0, low: 0, bad: 0 };
    let moodTotal = 0;
    moods.forEach(m => { moodDist[m.mood] = m._count._all; moodTotal += m._count._all; });

    // Rest days in this period
    const restDaysCount = await prisma.restDay.count({
      where: { user_id: userId, date: { gte: start } }
    });

    // Active days (any log)
    const activeDaysRaw = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT date) as count FROM (
        SELECT date FROM movement_logs WHERE user_id = ${userId} AND date >= ${start}
        UNION SELECT date FROM sleep_logs WHERE user_id = ${userId} AND date >= ${start}
        UNION SELECT date FROM nutrition_logs WHERE user_id = ${userId} AND date >= ${start}
        UNION SELECT date FROM mood_logs WHERE user_id = ${userId} AND date >= ${start}
      )
    `;
    const activeDays = Number(activeDaysRaw[0].count);

    const consistency = Math.round((activeDays / days) * 100);

    // 14-day meal history (always last 2 weeks regardless of range)
    const historyStart = new Date();
    historyStart.setDate(historyStart.getDate() - 13);
    const histStart = historyStart.toISOString().split('T')[0];

    const mealHistory = await prisma.nutritionLog.findMany({
      where: { user_id: userId, date: { gte: histStart } },
      orderBy: { date: 'desc' },
      select: {
        date: true, breakfast: true, lunch: true, snacks: true, dinner: true,
        breakfast_note: true, lunch_note: true, snacks_note: true, dinner_note: true, water_glasses: true
      }
    });

    res.json({
      range,
      days,
      consistency,
      active_days: activeDays,
      rest_days: restDaysCount,
      movement: {
        logged_days: movement.logged_days,
        avg_steps: Math.round(movement.avg_steps),
        avg_active_minutes: Math.round(movement.avg_active_minutes),
        max_steps: movement.max_steps
      },
      sleep: {
        logged_days: sleep.logged_days,
        avg_hours: Math.round(sleep.avg_hours * 10) / 10,
        avg_quality: Math.round(sleep.avg_quality * 10) / 10,
        min_hours: sleep.min_hours,
        max_hours: sleep.max_hours
      },
      nutrition: {
        logged_days: nutrition.logged_days,
        meal_consistency: mealConsistency,
        breakfast_rate: nutrition.logged_days ? Math.round((nutrition.breakfast_count / nutrition.logged_days) * 100) : 0,
        lunch_rate: nutrition.logged_days ? Math.round((nutrition.lunch_count / nutrition.logged_days) * 100) : 0,
        snacks_rate: nutrition.logged_days ? Math.round((nutrition.snacks_count / nutrition.logged_days) * 100) : 0,
        dinner_rate: nutrition.logged_days ? Math.round((nutrition.dinner_count / nutrition.logged_days) * 100) : 0,
        avg_water: Math.round(nutrition.avg_water * 10) / 10
      },
      mood: {
        total_logs: moodTotal,
        distribution: moodDist
      },
      meal_history: mealHistory
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

module.exports = router;
