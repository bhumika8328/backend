// GET /api/alerts, GET /api/alerts/:id, POST /api/alerts/:id/acknowledge
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const socketService = require('../services/socketService');

async function listAlerts(req, res, next) {
  try {
    const filter = {};
    if (['OPEN', 'ACKNOWLEDGED'].includes(req.query.status)) filter.status = req.query.status;
    if (['SOS', 'RISK'].includes(req.query.type)) filter.type = req.query.type;
    if (typeof req.query.studentId === 'string') filter.studentId = req.query.studentId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json(alerts);
  } catch (err) { next(err); }
}

async function getAlert(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid alert id' });
    const alert = await Alert.findById(req.params.id).lean();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) { next(err); }
}

async function acknowledgeAlert(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid alert id' });
    const by = typeof req.body?.facultyId === 'string' ? req.body.facultyId.slice(0, 64) : 'unknown';
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'ACKNOWLEDGED', acknowledgedBy: by, acknowledgedAt: new Date() },
      { new: true }
    ).lean();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    socketService.emit('alert:acknowledged', alert);
    res.json(alert);
  } catch (err) { next(err); }
}

module.exports = { listAlerts, getAlert, acknowledgeAlert };
