// Permanent record of every SOS button press.
const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    priority: { type: String, default: 'HIGH' },
    locationSource: { type: String, enum: ['sos-request', 'redis-latest'], default: 'sos-request' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sos', sosSchema);
