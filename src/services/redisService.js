// All Redis logic lives here.
//
// Keys used:
//   student:<id>:location  -> latest location JSON (expires after TTL)
//   student:<id>:history   -> last few points (list, used by AI for speed/direction)
//   student:<id>:risk      -> latest AI result JSON
//   student:<id>:lastSaved -> last point saved to MongoDB (to decide "important" points)
//   student:<id>:alertcd   -> exists while alert cooldown is active
const redis = require('../config/redis');
const env = require('../config/env');

const HISTORY_SIZE = 10;
const k = (id, name) => `student:${id}:${name}`;

async function setLatestLocation(point) {
  // SET overwrites the old value - this is the "Old location -> New location" step.
  await redis.set(k(point.studentId, 'location'), JSON.stringify(point), 'EX', env.locationTtl);
}

async function getLatestLocation(studentId) {
  const raw = await redis.get(k(studentId, 'location'));
  return raw ? JSON.parse(raw) : null;
}

async function getRecentPoints(studentId) {
  const items = await redis.lrange(k(studentId, 'history'), 0, HISTORY_SIZE - 1);
  return items.map((s) => JSON.parse(s)).reverse(); // oldest -> newest
}

async function pushRecentPoint(point) {
  const key = k(point.studentId, 'history');
  await redis.multi().lpush(key, JSON.stringify(point)).ltrim(key, 0, HISTORY_SIZE - 1).expire(key, env.locationTtl * 4).exec();
}

async function setRisk(studentId, risk) {
  await redis.set(k(studentId, 'risk'), JSON.stringify(risk), 'EX', env.locationTtl * 4);
}

async function getRisk(studentId) {
  const raw = await redis.get(k(studentId, 'risk'));
  return raw ? JSON.parse(raw) : null;
}

async function getLastSaved(studentId) {
  const raw = await redis.get(k(studentId, 'lastSaved'));
  return raw ? JSON.parse(raw) : null;
}

async function setLastSaved(point) {
  await redis.set(k(point.studentId, 'lastSaved'), JSON.stringify(point), 'EX', 86400);
}

// Returns true if we are allowed to raise a new alert (and starts the cooldown).
async function tryStartAlertCooldown(studentId) {
  const res = await redis.set(k(studentId, 'alertcd'), '1', 'EX', env.alertCooldown, 'NX');
  return res === 'OK';
}

module.exports = {
  setLatestLocation, getLatestLocation, getRecentPoints, pushRecentPoint,
  setRisk, getRisk, getLastSaved, setLastSaved, tryStartAlertCooldown,
};
