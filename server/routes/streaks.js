const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/streaks
router.get('/', async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const today = new Date();

    // Get dates that have ALL 4 logs OR are marked as rest days
    const loggedDatesRaw = await prisma.$queryRaw`
      SELECT DISTINCT date FROM (
        SELECT date FROM movement_logs WHERE user_id = ${userId}
        INTERSECT SELECT date FROM sleep_logs WHERE user_id = ${userId}
        INTERSECT SELECT date FROM nutrition_logs WHERE user_id = ${userId}
        INTERSECT SELECT date FROM mood_logs WHERE user_id = ${userId}
      )
      UNION
      SELECT date FROM rest_days WHERE user_id = ${userId}
      ORDER BY date DESC
    `;
    const loggedDates = loggedDatesRaw.map(r => r.date);

    const dateSet = new Set(loggedDates);

    // Calculate current streak (counting backward from today)
    let currentStreak = 0;
    let checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    // Sort ascending for longest calculation
    const sorted = [...loggedDates].sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    res.json({ current_streak: currentStreak, longest_streak: longestStreak });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate streaks.' });
  }
});

module.exports = router;
