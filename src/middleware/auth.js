// Authentication-ready placeholder.
// If API_KEY is set in .env, every request must send:  x-api-key: <API_KEY>
// Later you can replace this with JWT login for faculty without touching routes/controllers.
const env = require('../config/env');

function auth(req, res, next) {
  if (!env.apiKey) return next(); // auth disabled (development)
  if (req.get('x-api-key') === env.apiKey) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = auth;
