// Socket.IO wrapper. Faculty App connects and receives live events.
//
// Events sent to faculty:
//   location:update      { studentId, latitude, longitude, timestamp }
//   risk:update          { studentId, riskScore, riskLevel, reasons, ... }
//   alert:new            full alert object (SOS or RISK)
//   alert:acknowledged   updated alert object
// Faculty may also emit "subscribe:student" with a studentId to join a per-student room (optional).
const { Server } = require('socket.io');
const env = require('../config/env');

let io = null;

function init(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.corsOrigins.includes('*') ? '*' : env.corsOrigins } });

  io.use((socket, next) => {
    // Auth-ready: same API key as REST. Client sends  io(url, { auth: { apiKey: '...' } })
    if (!env.apiKey || socket.handshake.auth?.apiKey === env.apiKey) return next();
    next(new Error('Unauthorized'));
  });

  io.on('connection', (socket) => {
    socket.join('faculty');
    console.log('[Socket.IO] faculty connected:', socket.id);
    socket.on('subscribe:student', (id) => typeof id === 'string' && socket.join(`student:${id}`));
    socket.on('disconnect', () => console.log('[Socket.IO] disconnected:', socket.id));
  });
  return io;
}

function emit(event, payload) {
  if (io) io.to('faculty').emit(event, payload);
}

module.exports = { init, emit };
