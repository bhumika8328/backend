// Student details + the safe area (geofence) and optional expected route used by the AI.
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    department: String,
    phone: String,
    // Safe area: a circle around the campus (or hostel etc.)
    geofence: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      radiusMeters: { type: Number, required: true, default: 1000 },
    },
    // Optional route the student normally follows (list of points)
    expectedRoute: [{ latitude: Number, longitude: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
