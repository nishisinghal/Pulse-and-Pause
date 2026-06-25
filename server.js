const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (creates tables on first run)
require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/movement', require('./server/routes/movement'));
app.use('/api/sleep', require('./server/routes/sleep'));
app.use('/api/nutrition', require('./server/routes/nutrition'));
app.use('/api/mood', require('./server/routes/mood'));
app.use('/api/restdays', require('./server/routes/restdays'));
app.use('/api/streaks', require('./server/routes/streaks'));
app.use('/api/events', require('./server/routes/events'));
app.use('/api/reports', require('./server/routes/reports'));
app.use('/api/periods', require('./server/routes/periods'));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏥 Pulse & Pause server running at http://localhost:${PORT}`);
});
