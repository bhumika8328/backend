// Redis connection (fast cache for latest location).
const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.redisUrl, { maxRetriesPerRequest: 3 });
redis.on('connect', () => console.log('[Redis] connected'));
redis.on('error', (err) => console.error('[Redis] error:', err.message));

module.exports = redis;
