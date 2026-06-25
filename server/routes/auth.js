const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
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
router.post('/signup', (req, res) => {
  try {
    const { name, email, password, dob, gender, country } = req.body;

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

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, dob, gender, country) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, password_hash, dob, gender, country);

    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email, age, gender, country } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, dob, gender, country, language, activity_level, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.age = calculateAge(user.dob);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { name, language, activity_level } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (language) { updates.push('language = ?'); values.push(language); }
    if (activity_level) { updates.push('activity_level = ?'); values.push(activity_level); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare('SELECT id, name, email, dob, gender, language, activity_level, created_at FROM users WHERE id = ?').get(req.user.id);
    user.age = calculateAge(user.dob);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

module.exports = router;
