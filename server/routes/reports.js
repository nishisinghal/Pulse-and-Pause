const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/reports?range=week|month
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const range = req.query.range || 'week';
    const days = range === 'month' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const start = startDate.toISOString().split('T')[0];

    // Movement stats
    const movement = db.prepare(`
      SELECT COUNT(*) as logged_days, COALESCE(AVG(steps), 0) as avg_steps,
        COALESCE(AVG(active_minutes), 0) as avg_active_minutes,
        COALESCE(MAX(steps), 0) as max_steps
      FROM movement_logs WHERE user_id = ? AND date >= ?
    `).get(userId, start);

    // Sleep stats
    const sleep = db.prepare(`
      SELECT COUNT(*) as logged_days, COALESCE(AVG(duration_hours), 0) as avg_hours,
        COALESCE(AVG(quality), 0) as avg_quality,
        COALESCE(MIN(duration_hours), 0) as min_hours,
        COALESCE(MAX(duration_hours), 0) as max_hours
      FROM sleep_logs WHERE user_id = ? AND date >= ?
    `).get(userId, start);

    // Nutrition stats
    const nutrition = db.prepare(`
      SELECT COUNT(*) as logged_days,
        COALESCE(SUM(breakfast), 0) as breakfast_count,
        COALESCE(SUM(lunch), 0) as lunch_count,
        COALESCE(SUM(snacks), 0) as snacks_count,
        COALESCE(SUM(dinner), 0) as dinner_count,
        COALESCE(AVG(water_glasses), 0) as avg_water
      FROM nutrition_logs WHERE user_id = ? AND date >= ?
    `).get(userId, start);

    const totalMeals = nutrition.logged_days * 4;
    const eatenMeals = nutrition.breakfast_count + nutrition.lunch_count + nutrition.snacks_count + nutrition.dinner_count;
    const mealConsistency = totalMeals > 0 ? Math.round((eatenMeals / totalMeals) * 100) : 0;

    // Mood stats
    const moods = db.prepare(`
      SELECT mood, COUNT(*) as count
      FROM mood_logs WHERE user_id = ? AND date >= ?
      GROUP BY mood
    `).all(userId, start);

    const moodDist = { great: 0, good: 0, okay: 0, low: 0, bad: 0 };
    let moodTotal = 0;
    moods.forEach(m => { moodDist[m.mood] = m.count; moodTotal += m.count; });

    // Rest days in this period
    const restDays = db.prepare(
      'SELECT COUNT(*) as count FROM rest_days WHERE user_id = ? AND date >= ?'
    ).get(userId, start).count;

    // Active days (any log)
    const activeDays = db.prepare(`
      SELECT COUNT(DISTINCT date) as count FROM (
        SELECT date FROM movement_logs WHERE user_id = ? AND date >= ?
        UNION SELECT date FROM sleep_logs WHERE user_id = ? AND date >= ?
        UNION SELECT date FROM nutrition_logs WHERE user_id = ? AND date >= ?
        UNION SELECT date FROM mood_logs WHERE user_id = ? AND date >= ?
      )
    `).get(userId, start, userId, start, userId, start, userId, start).count;

    const consistency = Math.round((activeDays / days) * 100);

    // 14-day meal history (always last 2 weeks regardless of range)
    const historyStart = new Date();
    historyStart.setDate(historyStart.getDate() - 13);
    const histStart = historyStart.toISOString().split('T')[0];

    const mealHistory = db.prepare(`
      SELECT date, breakfast, lunch, snacks, dinner,
        breakfast_note, lunch_note, snacks_note, dinner_note, water_glasses
      FROM nutrition_logs WHERE user_id = ? AND date >= ? ORDER BY date DESC
    `).all(userId, histStart);

    res.json({
      range,
      days,
      consistency,
      active_days: activeDays,
      rest_days: restDays,
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
