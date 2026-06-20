require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDB, isDbConnected } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const { isMockMode } = require('./services/aiService');

const app = express();

// --- Core middleware ---
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// --- Health check (also reports DB + AI mode, useful for the deployed demo) ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: isDbConnected() ? 'connected' : 'disconnected',
    aiMode: isMockMode() ? 'mock' : 'gemini',
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(); // logs a warning and continues if it fails — see config/db.js

  if (isMockMode()) {
    console.warn(
      '[ai] GEMINI_API_KEY not set — running in MOCK MODE. Itineraries will use deterministic sample data instead of live AI generation.'
    );
  }

  app.listen(PORT, () => {
    console.log(`[server] AI Travel Planner API listening on port ${PORT}`);
  });
}

start();

module.exports = app;
