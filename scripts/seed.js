// Creates sample students + faculty. Run:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');

// Campus centre (sample coordinates in Hyderabad). Change to your own campus.
const centre = { latitude: 17.385, longitude: 78.4867, radiusMeters: 1000 };

const students = [
  { studentId: 'S101', name: 'Asha Rao', department: 'CSE', geofence: centre,
    expectedRoute: [{ latitude: 17.385, longitude: 78.4867 }, { latitude: 17.386, longitude: 78.4877 }, { latitude: 17.387, longitude: 78.4887 }] },
  { studentId: 'S102', name: 'Ravi Kumar', department: 'ECE', geofence: centre },
  { studentId: 'S103', name: 'Meena Iyer', department: 'IT', geofence: centre },
];

(async () => {
  await mongoose.connect(env.mongoUri);
  for (const s of students) await Student.updateOne({ studentId: s.studentId }, s, { upsert: true });
  await Faculty.updateOne({ facultyId: 'F001' }, { facultyId: 'F001', name: 'Dr. Sharma', email: 'sharma@example.edu', department: 'CSE' }, { upsert: true });
  console.log('Seeded', students.length, 'students and 1 faculty');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
