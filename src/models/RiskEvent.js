// AI risk/anomaly events (only stored when level is WARNING or HIGH_RISK).
const mongoose = require('mongoose');

const riskEventSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['NORMAL', 'WARNING', 'HIGH_RISK'], required: true },
    reasons: [String],
    latitude: Number,
    longitude: Number,
    timestamp: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('RiskEvent', riskEventSchema);
