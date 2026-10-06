// Redis connection (fast cache for latest location).
/*
const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.redisUrl, { maxRetriesPerRequest: 3 });
redis.on('connect', () => console.log('[Redis] connected'));
redis.on('error', (err) => console.error('[Redis] error:', err.message));

module.exports = redis;
*/
const Redis = require('ioredis');

let url = (process.env.REDIS_URL || '').trim();

// If someone pasted the full "redis-cli --tls -u redis://..." command, extract the URL
const m = url.match(/redis:\/\/\S+/);
if (m) url = m[0];

// Upstash needs TLS
if (url.includes('upstash.io') && url.startsWith('redis://')) {
  url = url.replace('redis://', 'rediss://');
}

const redis = new Redis(url, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 500, 5000), // back off instead of hammering
});

redis.on('connect', () => console.log('[Redis] connected'));
redis.on('error', (err) => console.error('[Redis] error:', err.message));

module.exports = redis;