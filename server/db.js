const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'swasthya.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('male','female')) NOT NULL,
    country TEXT DEFAULT 'IN',
    language TEXT DEFAULT 'en',
    activity_level TEXT DEFAULT 'moderate',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movement_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    steps INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    workout_type TEXT,
    workout_duration INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS sleep_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    bedtime TEXT,
    wake_time TEXT,
    duration_hours REAL,
    quality INTEGER CHECK(quality BETWEEN 1 AND 5),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS nutrition_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    breakfast INTEGER DEFAULT 0,
    lunch INTEGER DEFAULT 0,
    snacks INTEGER DEFAULT 0,
    dinner INTEGER DEFAULT 0,
    breakfast_note TEXT DEFAULT '',
    lunch_note TEXT DEFAULT '',
    snacks_note TEXT DEFAULT '',
    dinner_note TEXT DEFAULT '',
    water_glasses INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS period_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    flow TEXT CHECK(flow IN ('light', 'normal', 'heavy')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    mood TEXT CHECK(mood IN ('great','good','okay','low','bad')),
    note TEXT DEFAULT '',
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS rest_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    month TEXT NOT NULL,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_id TEXT NOT NULL,
    registered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, event_id)
  );

  CREATE TABLE IF NOT EXISTS screen_time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
  );
`);

module.exports = db;
