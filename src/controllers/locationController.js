// POST /api/location  and  GET /api/students/:studentId/location
const { findStudent } = require('../services/studentService');
const redisService = require('../services/redisService');
const { processLocation } = require('../services/locationService');

async function postLocation(req, res, next) {
  try {
    const point = req.point; // already validated
    const student = await findStudent(point.studentId);
    if (!student) return res.status(404).json({ error: `Unknown studentId ${point.studentId}` });

    const { risk, alert } = await processLocation(student, point);
    res.status(200).json({ status: 'ok', location: point, risk, alertCreated: !!alert });
  } catch (err) { next(err); }
}

async function getLatestLocation(req, res, next) {
  try {
    const { studentId } = req.params;
    const cached = await redisService.getLatestLocation(studentId);
    if (cached) return res.json(cached); // fast path: Redis

    // Fallback: Redis entry expired -> use last saved point in MongoDB
    const LocationHistory = require('../models/LocationHistory');
    const doc = await LocationHistory.findOne({ studentId }).sort({ timestamp: -1 }).lean();
    if (!doc) return res.status(404).json({ error: 'No location found for this student' });
    res.json({ studentId, latitude: doc.latitude, longitude: doc.longitude, timestamp: doc.timestamp.toISOString(), source: 'database' });
  } catch (err) { next(err); }
}

module.exports = { postLocation, getLatestLocation };
