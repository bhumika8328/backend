// Bridge between the backend and the AI module.
// By default it runs the local rule-based engine (src/ai/riskEngine.js).
// If you later build a Python/FastAPI model, only this file needs to change
// (call it with fetch() and return the same {riskScore, riskLevel, reasons} shape).
const { analyze } = require('../ai/riskEngine');

async function analyzeMovement({ student, point, recentPoints, recentRisks }) {
  return analyze({ student, point, recentPoints, recentRisks });
}

module.exports = { analyzeMovement };
