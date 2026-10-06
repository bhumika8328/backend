// Student lookup helper.
const Student = require('../models/Student');

async function findStudent(studentId) {
  return Student.findOne({ studentId }).lean();
}

module.exports = { findStudent };
