// Entry point: starts Express, Socket.IO, MongoDB and Redis.
const http = require('http');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { connectMongo } = require('./config/db');
const redis = require('./config/redis');
const socketService = require('./services/socketService');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', async (req, res) => {
  res.json({ status: 'ok', redis: redis.status, time: new Date().toISOString() });
});
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectMongo();
  const server = http.createServer(app);
  socketService.init(server);
  server.listen(env.port, () => console.log(`[Server] running on http://localhost:${env.port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
