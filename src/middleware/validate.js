// Simple hand-written input validation (no extra libraries, easy to read).
function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

// Used by POST /api/location and POST /api/sos (same body shape).
function validatePoint(req, res, next) {
  const { studentId, latitude, longitude, timestamp } = req.body || {};
  const errors = [];

  if (typeof studentId !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(studentId)) {
    errors.push('studentId must be a string (letters, digits, - or _, max 32 chars)');
  }
  if (!isNum(latitude) || latitude < -90 || latitude > 90) {
    errors.push('latitude must be a number between -90 and 90');
  }
  if (!isNum(longitude) || longitude < -180 || longitude > 180) {
    errors.push('longitude must be a number between -180 and 180');
  }
  let ts = new Date();
  if (timestamp !== undefined) {
    ts = new Date(timestamp);
    if (Number.isNaN(ts.getTime())) errors.push('timestamp must be a valid ISO date string');
  }

  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  req.point = { studentId, latitude, longitude, timestamp: ts.toISOString() };
  next();
}

module.exports = { validatePoint };
