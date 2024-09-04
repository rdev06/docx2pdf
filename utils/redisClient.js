import Redis from 'ioredis';

const config = { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT };
if (process.env.REDIS_PASSWORD) config.password = process.env.REDIS_PASSWORD;
const redisClient = new Redis({
  ...config,
  keyPrefix: process.env.TOPIC_PREFIX,
  retryStrategy(times) {
    if (times === parseInt(process.env.MAX_REDIS_RETRY)) {
      return false;
    }
    return Math.min(times * 50, 2000);
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains 'READONLY'
      return true; // or `return 1;`
    }
  }
});

export default redisClient;