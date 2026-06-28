const router = require('express').Router();
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/streaks
router.get('/', async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Fetch all logs for the user using Prisma ORM (safer than raw SQL)
    const [movements, sleeps, nutritions, moods, restDays] = await Promise.all([
      prisma.movementLog.findMany({ where: { user_id: userId }, select: { date: true } }),
      prisma.sleepLog.findMany({ where: { user_id: userId }, select: { date: true } }),
      prisma.nutritionLog.findMany({ where: { user_id: userId }, select: { date: true } }),
      prisma.moodLog.findMany({ where: { user_id: userId }, select: { date: true } }),
      prisma.restDay.findMany({ where: { user_id: userId }, select: { date: true } })
    ]);

    // Convert to sets of date strings
    const moveSet = new Set(movements.map(m => m.date));
    const sleepSet = new Set(sleeps.map(m => m.date));
    const nutSet = new Set(nutritions.map(m => m.date));
    const moodSet = new Set(moods.map(m => m.date));
    const restSet = new Set(restDays.map(m => m.date));

    // A date is "valid" ONLY if it has all 4 entries OR is marked as a rest day
    const allDates = new Set([...moveSet, ...sleepSet, ...nutSet, ...moodSet, ...restSet]);
    const validDates = new Set();
    
    for (const d of allDates) {
      if (restSet.has(d) || (moveSet.has(d) && sleepSet.has(d) && nutSet.has(d) && moodSet.has(d))) {
        validDates.add(d);
      }
    }

    // Calculate current streak (counting backward from today or yesterday)
    let currentStreak = 0;
    let checkDate = new Date();
    let checkStr = checkDate.toISOString().split('T')[0];

    // If today is not completed yet, the streak shouldn't break. Start counting from yesterday.
    if (!validDates.has(checkStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0];
    }

    while (validDates.has(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0];
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sorted = Array.from(validDates).sort();
    
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
    console.error('Streak calc error:', err);
    res.status(500).json({ error: 'Failed to calculate streaks.' });
  }
});

module.exports = router;
