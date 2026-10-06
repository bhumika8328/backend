// The main pipeline for one incoming location:
//   Redis (latest) -> AI analysis -> MongoDB (only if important) -> Socket.IO -> alert if needed
const env = require('../config/env');
const redisService = require('./redisService');
const aiService = require('./aiService');
const socketService = require('./socketService');
const alertService = require('./alertService');
const LocationHistory = require('../models/LocationHistory');
const { haversine } = require('../ai/geo');

// Decide whether this point deserves a permanent record.
function shouldSave(point, lastSaved, risk) {
  if (!lastSaved) return true;
  if (risk.riskLevel !== 'NORMAL') return true;
  const moved = haversine(lastSaved, point);
  const seconds = (new Date(point.timestamp) - new Date(lastSaved.timestamp)) / 1000;
  return moved >= env.saveMinDistance || seconds >= env.saveMinInterval;
}

async function processLocation(student, point) {
  // 1. Redis: overwrite latest location
  await redisService.setLatestLocation(point);

  // 2. AI: analyse using recent points (before adding this one)
  const recentPoints = await redisService.getRecentPoints(point.studentId);
  const prevRisk = await redisService.getRisk(point.studentId);
  const recentRisks = prevRisk?.recentLevels || [];
  const result = await aiService.analyzeMovement({ student, point, recentPoints, recentRisks });
  const risk = {
    studentId: point.studentId,
    ...result,
    recentLevels: [...recentRisks, result.riskLevel].slice(-5),
    timestamp: point.timestamp,
  };
  await redisService.pushRecentPoint(point);
  await redisService.setRisk(point.studentId, risk);

  // 3. MongoDB: store only important points
  const lastSaved = await redisService.getLastSaved(point.studentId);
  if (shouldSave(point, lastSaved, risk)) {
    await LocationHistory.create({ ...point, riskLevel: risk.riskLevel, riskScore: risk.riskScore });
    await redisService.setLastSaved(point);
  }

  // 4. Socket.IO: tell the Faculty App right away
  socketService.emit('location:update', point);
  socketService.emit('risk:update', publicRisk(risk));

  // 5. Alert (WARNING / HIGH_RISK), rate-limited by a cooldown so faculty are not spammed
  let alert = null;
  if (risk.riskLevel !== 'NORMAL' && (await redisService.tryStartAlertCooldown(point.studentId))) {
    alert = await alertService.createRiskAlert(student, point, risk);
  }
  return { risk: publicRisk(risk), alert };
}

// Remove internal fields before sending to clients.
function publicRisk(r) {
  const { recentLevels, ...rest } = r; // eslint-disable-line no-unused-vars
  return rest;
}

module.exports = { processLocation, publicRisk };
