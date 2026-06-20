const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI in process.env.MONGO_URI.
 * The server is allowed to boot even if this fails (see server.js),
 * so a missing/unreachable database doesn't crash local development
 * before the developer has set up Atlas — but every data route will
 * correctly fail with a clear 503 until the connection is healthy.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('[db] MONGO_URI is not set. Skipping database connection.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
    return true;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    return false;
  }
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDbConnected };
