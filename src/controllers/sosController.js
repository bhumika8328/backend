// POST /api/sos
const Sos = require('../models/Sos');
const { findStudent } = require('../services/studentService');
const redisService = require('../services/redisService');
const alertService = require('../services/alertService');

async function postSos(req, res, next) {
  try {
    const point = req.point;
    const student = await findStudent(point.studentId);
    if (!student) return res.status(404).json({ error: `Unknown studentId ${point.studentId}` });

    // Prefer the freshest latest location from Redis if it exists and is newer than the SOS point.
    const latest = await redisService.getLatestLocation(point.studentId);
    const useLatest = latest && new Date(latest.timestamp) > new Date(point.timestamp);
    const where = useLatest ? latest : point;

    const sos = await Sos.create({
      studentId: point.studentId, latitude: where.latitude, longitude: where.longitude,
      timestamp: point.timestamp, priority: 'HIGH', locationSource: useLatest ? 'redis-latest' : 'sos-request',
    });
    const alert = await alertService.createSosAlert(student, { ...where, studentId: point.studentId });

    res.status(201).json({ status: 'SOS received', sosId: sos._id, alertId: alert._id, priority: 'HIGH' });
  } catch (err) { next(err); }
}

module.exports = { postSos };
