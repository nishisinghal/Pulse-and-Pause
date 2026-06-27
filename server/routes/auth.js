const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    let { name, email, password, dob, gender, country } = req.body;
    if (email) email = email.toLowerCase().trim();

    if (!name || !email || !password || !dob || !gender || !country) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const age = calculateAge(dob);
    if (age < 13 || age > 30) {
      return res.status(400).json({ error: 'Age must be between 13 and 30 years.' });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be male or female.' });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password_hash, dob, gender, country }
    });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user.id, name, email, age, gender, country } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email) email = email.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    const age = calculateAge(user.dob);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, age, gender: user.gender, country: user.country } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, name: true, email: true, dob: true, gender: true, country: true, language: true, activity_level: true, created_at: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.age = calculateAge(user.dob);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, language, activity_level } = req.body;

    if (!name && !language && !activity_level) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    const user = await prisma.user.update({
      where: { id: Number(req.user.id) },
      data: {
        ...(name && { name }),
        ...(language && { language }),
        ...(activity_level && { activity_level }),
      },
      select: { id: true, name: true, email: true, dob: true, gender: true, language: true, activity_level: true, created_at: true }
    });

    user.age = calculateAge(user.dob);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

module.exports = router;
