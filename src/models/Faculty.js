// Faculty details. Authentication is not wired in yet (see middleware/auth.js).
const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    facultyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    department: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);
