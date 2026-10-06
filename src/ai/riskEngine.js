// Explainable rule-based risk engine (a simple "AI" suitable for a college project).
//
// Each rule adds points to a risk score (0-100) AND adds a human-readable reason,
// so faculty can see exactly WHY a warning appeared. It never claims a student is in danger;
// it only says movement looks abnormal.
//
//   score <  30  -> NORMAL
//   score 30-59  -> WARNING
//   score >= 60  -> HIGH_RISK
//
// Rules:
//   1. Geofence       outside the permitted area
//   2. Speed          faster than normal walking/cycling
//   3. Sudden move    large jump or sudden speed change (also catches GPS jumps)
//   4. Route          far from the student's expected route (if one is configured)
//   5. Pattern        repeatedly reversing direction
//   6. Repetition     several recent readings were already abnormal
const { haversine, bearing } = require('./geo');

const CONFIG = {
  fastSpeed: 8,            // m/s (~29 km/h) - faster than walking/cycling
  veryFastSpeed: 20,       // m/s (~72 km/h)
  suddenSpeedChange: 6,    // m/s change between two consecutive segments
  teleportDistance: 2000,  // metres in one update = sudden jump
  routeDeviation: 150,     // metres away from every route point
  reversalAngle: 140,      // degrees turn counted as a direction reversal
  minMoveForBearing: 5,    // ignore GPS noise smaller than this (metres)
  warningAt: 30,
  highRiskAt: 60,
};

function levelFor(score) {
  if (score >= CONFIG.highRiskAt) return 'HIGH_RISK';
  if (score >= CONFIG.warningAt) return 'WARNING';
  return 'NORMAL';
}

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function analyze({ student, point, recentPoints = [], recentRisks = [] }) {
  let score = 0;
  const reasons = [];
  const add = (points, text) => { score += points; reasons.push(text); };

  // 1. Geofence
  const g = student.geofence;
  if (g) {
    const dist = haversine(g, point);
    if (dist > g.radiusMeters) {
      const over = dist - g.radiusMeters;
      const pts = over > g.radiusMeters ? 55 : 40; // far outside = higher
      add(pts, `Student moved outside the permitted area (${Math.round(dist)} m from centre, limit ${g.radiusMeters} m)`);
    }
  }

  // Build movement segments from recent points + the new point
  const pts = [...recentPoints, point];
  const segs = [];
  for (let i = 1; i < pts.length; i++) {
    const dt = (new Date(pts[i].timestamp) - new Date(pts[i - 1].timestamp)) / 1000;
    if (dt <= 0) continue; // out-of-order or duplicate timestamp
    const d = haversine(pts[i - 1], pts[i]);
    segs.push({ d, dt, speed: d / dt, from: pts[i - 1], to: pts[i] });
  }
  const last = segs[segs.length - 1];

  if (last) {
    // 2. Speed
    if (last.speed >= CONFIG.veryFastSpeed) add(30, `Very high movement speed detected (${(last.speed * 3.6).toFixed(0)} km/h)`);
    else if (last.speed >= CONFIG.fastSpeed) add(20, `Unusual movement speed detected (${(last.speed * 3.6).toFixed(0)} km/h)`);

    // 3. Sudden movement
    if (last.d >= CONFIG.teleportDistance) {
      add(20, `Sudden large jump in location (${Math.round(last.d)} m in ${Math.round(last.dt)} s)`);
    } else if (segs.length >= 2) {
      const prev = segs[segs.length - 2];
      if (Math.abs(last.speed - prev.speed) >= CONFIG.suddenSpeedChange) {
        add(15, 'Sudden change in movement speed');
      }
    }
  }

  // 4. Route deviation
  if (student.expectedRoute && student.expectedRoute.length) {
    const nearest = Math.min(...student.expectedRoute.map((p) => haversine(p, point)));
    if (nearest > CONFIG.routeDeviation) add(25, `Student deviated from the expected route (${Math.round(nearest)} m away)`);
  }

  // 5. Unusual pattern: direction reversals in recent movement
  const bearings = segs.filter((s) => s.d >= CONFIG.minMoveForBearing).map((s) => bearing(s.from, s.to));
  let reversals = 0;
  for (let i = 1; i < bearings.length; i++) {
    if (angleDiff(bearings[i], bearings[i - 1]) >= CONFIG.reversalAngle) reversals++;
  }
  if (reversals >= 2) add(10, `Unusual movement pattern (${reversals} sharp direction reversals recently)`);

  // 6. Repeated abnormal movement
  const abnormalRecent = recentRisks.filter((l) => l !== 'NORMAL').length;
  if (abnormalRecent >= 3 && score > 0) add(15, 'Abnormal movement has been repeated in recent updates');

  score = Math.min(100, score);
  if (reasons.length === 0) reasons.push('Movement looks normal');

  return {
    riskScore: score,
    riskLevel: levelFor(score),
    reasons,
    note: 'Automated analysis of movement only. It indicates unusual patterns, not confirmed danger.',
  };
}

module.exports = { analyze, CONFIG };
