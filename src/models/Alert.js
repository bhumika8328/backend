// Alerts shown to faculty. type = SOS or RISK. Faculty can acknowledge them.
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    type: { type: String, enum: ['SOS', 'RISK'], required: true },
    priority: { type: String, enum: ['MEDIUM', 'HIGH'], default: 'MEDIUM' },
    message: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    riskScore: Number,
    riskLevel: String,
    reasons: [String],
    status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED'], default: 'OPEN', index: true },
    acknowledgedBy: String,
    acknowledgedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
