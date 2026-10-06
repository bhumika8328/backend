// Creates alerts in MongoDB and pushes them to faculty over Socket.IO.
const Alert = require('../models/Alert');
const RiskEvent = require('../models/RiskEvent');
const socketService = require('./socketService');

async function createRiskAlert(student, point, risk) {
  await RiskEvent.create({
    studentId: point.studentId, riskScore: risk.riskScore, riskLevel: risk.riskLevel,
    reasons: risk.reasons, latitude: point.latitude, longitude: point.longitude, timestamp: point.timestamp,
  });
  const alert = await Alert.create({
    studentId: point.studentId,
    type: 'RISK',
    priority: risk.riskLevel === 'HIGH_RISK' ? 'HIGH' : 'MEDIUM',
    message: `${student.name} (${point.studentId}): ${risk.riskLevel} - possible abnormal movement`,
    latitude: point.latitude, longitude: point.longitude,
    riskScore: risk.riskScore, riskLevel: risk.riskLevel, reasons: risk.reasons,
  });
  socketService.emit('alert:new', alert);
  return alert;
}

async function createSosAlert(student, point) {
  const alert = await Alert.create({
    studentId: point.studentId,
    type: 'SOS',
    priority: 'HIGH',
    message: `SOS from ${student.name} (${point.studentId})`,
    latitude: point.latitude, longitude: point.longitude,
  });
  socketService.emit('alert:new', alert);
  return alert;
}

module.exports = { createRiskAlert, createSosAlert };
