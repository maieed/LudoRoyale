const Redis = require("ioredis");

let redis;

const getRedis = (redisUrl) => {
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });
  }
  return redis;
};

module.exports = { getRedis };