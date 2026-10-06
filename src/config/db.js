// MongoDB connection (permanent storage).
const mongoose = require('mongoose');
const env = require('./env');

async function connectMongo() {
  await mongoose.connect(env.mongoUri);
  console.log('[MongoDB] connected');
}

module.exports = { connectMongo };
