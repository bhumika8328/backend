// "Important" location history only (not every second). See locationService.shouldSave().
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  riskLevel: { type: String, enum: ['NORMAL', 'WARNING', 'HIGH_RISK'], default: 'NORMAL' },
  riskScore: { type: Number, default: 0 },
});
locationSchema.index({ studentId: 1, timestamp: -1 });

module.exports = mongoose.model('LocationHistory', locationSchema);
