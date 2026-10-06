// Simple end-to-end test. Start the server first, then:  npm run test:api
// Needs Node 18+ (built-in fetch). Optional: set BASE_URL and API_KEY env vars.
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const headers = { 'Content-Type': 'application/json', ...(process.env.API_KEY ? { 'x-api-key': process.env.API_KEY } : {}) };

let failures = 0;
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : extra}`);
  if (!cond) failures++;
}
const call = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

(async () => {
  const now = Date.now();
  const at = (sec) => new Date(now + sec * 1000).toISOString();

  // 1. Normal location inside campus
  let r = await call('POST', '/api/location', { studentId: 'S101', latitude: 17.385, longitude: 78.4867, timestamp: at(0) });
  check('POST /api/location (normal) -> 200', r.status === 200, JSON.stringify(r.data));
  check('risk is NORMAL', r.data.risk?.riskLevel === 'NORMAL', JSON.stringify(r.data.risk));

  // 2. Validation
  r = await call('POST', '/api/location', { studentId: 'S101', latitude: 999, longitude: 78.4867 });
  check('invalid latitude -> 400', r.status === 400);
  r = await call('POST', '/api/location', { studentId: 'NOPE', latitude: 17.385, longitude: 78.4867 });
  check('unknown student -> 404', r.status === 404);

  // 3. Latest location from Redis
  r = await call('GET', '/api/students/S101/location');
  check('GET latest location -> 200', r.status === 200 && r.data.latitude === 17.385, JSON.stringify(r.data));

  // 4. Abnormal: far outside campus, very quickly
  r = await call('POST', '/api/location', { studentId: 'S101', latitude: 17.45, longitude: 78.55, timestamp: at(30) });
  check('abnormal location -> HIGH_RISK', r.data.risk?.riskLevel === 'HIGH_RISK', JSON.stringify(r.data.risk));
  r = await call('GET', '/api/students/S101/risk');
  check('GET risk -> 200 with reasons', r.status === 200 && r.data.reasons?.length > 0, JSON.stringify(r.data));

  // 5. SOS
  r = await call('POST', '/api/sos', { studentId: 'S102', latitude: 17.385, longitude: 78.4867, timestamp: at(60) });
  check('POST /api/sos -> 201', r.status === 201, JSON.stringify(r.data));
  const sosAlertId = r.data.alertId;

  // 6. Alerts
  r = await call('GET', '/api/alerts?status=OPEN');
  check('GET /api/alerts -> list', r.status === 200 && Array.isArray(r.data) && r.data.length > 0);
  check('SOS alert present and HIGH priority', r.data.some((a) => a._id === sosAlertId && a.priority === 'HIGH'));
  r = await call('POST', `/api/alerts/${sosAlertId}/acknowledge`, { facultyId: 'F001' });
  check('acknowledge alert', r.status === 200 && r.data.status === 'ACKNOWLEDGED', JSON.stringify(r.data));
  r = await call('GET', '/api/students');
  check('GET /api/students -> list', r.status === 200 && r.data.length >= 3);

  console.log(failures ? `\n${failures} test(s) failed` : '\nAll tests passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('Could not reach server:', e.message); process.exit(1); });
