// GET /api/students  and  GET /api/students/:studentId/risk
const Student = require('../models/Student');
const redisService = require('../services/redisService');
const { publicRisk } = require('../services/locationService');

async function listStudents(req, res, next) {
  try {
    const students = await Student.find().select('-expectedRoute -__v').lean();
    const result = await Promise.all(
      students.map(async (s) => ({
        ...s,
        latestLocation: await redisService.getLatestLocation(s.studentId),
        risk: await redisService.getRisk(s.studentId).then((r) => (r ? publicRisk(r) : null)),
      }))
    );
    res.json(result);
  } catch (err) { next(err); }
}

async function getRisk(req, res, next) {
  try {
    const risk = await redisService.getRisk(req.params.studentId);
    if (!risk) return res.status(404).json({ error: 'No risk analysis available yet for this student' });
    res.json(publicRisk(risk));
  } catch (err) { next(err); }
}

module.exports = { listStudents, getRisk };
