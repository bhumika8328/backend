// Loads .env and exposes settings in one place so no other file reads process.env directly.
require('dotenv').config();

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

module.exports = {
  port: num(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_safety',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  locationTtl: num(process.env.LOCATION_TTL_SECONDS, 300),
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),
  apiKey: process.env.API_KEY || '',
  saveMinDistance: num(process.env.SAVE_MIN_DISTANCE_METERS, 50),
  saveMinInterval: num(process.env.SAVE_MIN_INTERVAL_SECONDS, 300),
  alertCooldown: num(process.env.ALERT_COOLDOWN_SECONDS, 120),
};
