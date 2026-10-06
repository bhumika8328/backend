// Pretends to be Phone B: sends a location every 2 seconds, walking, then drifting out of campus.
// Also listens like the Faculty App so you can watch real-time events.
//   Terminal 1: npm start      Terminal 2: npm run simulate
const { io } = require('socket.io-client');
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const headers = { 'Content-Type': 'application/json', ...(process.env.API_KEY ? { 'x-api-key': process.env.API_KEY } : {}) };

const socket = io(BASE, { auth: { apiKey: process.env.API_KEY } });
socket.on('connect', () => console.log('[Faculty sim] connected'));
socket.on('risk:update', (r) => console.log(`[Faculty sim] risk ${r.riskLevel} (${r.riskScore})`, r.reasons.join('; ')));
socket.on('alert:new', (a) => console.log('[Faculty sim] ALERT:', a.type, a.priority, a.message));

let lat = 17.385, lon = 78.4867, step = 0;
setInterval(async () => {
  step++;
  // Walk north-east slowly; after 15 steps start moving faster (~0.001 deg ~ 110 m per 2 s)
  const d = step < 15 ? 0.00002 : 0.001;
  lat += d; lon += d;
  const res = await fetch(BASE + '/api/location', {
    method: 'POST', headers,
    body: JSON.stringify({ studentId: 'S101', latitude: lat, longitude: lon, timestamp: new Date().toISOString() }),
  }).then((r) => r.json()).catch((e) => ({ error: e.message }));
  console.log(`[Phone B sim] sent ${lat.toFixed(5)},${lon.toFixed(5)} ->`, res.risk?.riskLevel || res.error);
}, 2000);
