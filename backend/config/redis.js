const Redis = require("ioredis");

let redis;

const extractRedisUrl = (rawValue) => {
  const value = String(rawValue || "").trim();
  if (!value) {
    throw new Error("REDIS_URL is missing");
  }

  // Supports accidental values like: redis-cli --tls -u rediss://...
  if (value.includes("redis-cli") && value.includes("-u")) {
    const parts = value.split(/\s+/);
    const urlIndex = parts.findIndex((part) => part === "-u");
    if (urlIndex >= 0 && parts[urlIndex + 1]) {
      return parts[urlIndex + 1].trim();
    }
  }

  const match = value.match(/rediss?:\/\/\S+/i);
  if (match) {
    return match[0].trim();
  }

  return value;
};

const buildRedisOptions = (redisUrl) => {
  const parsed = new URL(redisUrl);
  if (!["redis:", "rediss:"].includes(parsed.protocol)) {
    throw new Error("REDIS_URL must start with redis:// or rediss://");
  }

  const username = decodeURIComponent(parsed.username || "");
  const password = decodeURIComponent(parsed.password || "");

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: username || undefined,
    password: password || undefined,
    // Upstash works better without INFO ready check, especially at startup.
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    ...(parsed.protocol === "rediss:" ? { tls: {} } : {})
  };
};

const getRedis = (redisUrl) => {
  if (!redis) {
    const normalizedUrl = extractRedisUrl(redisUrl);
    const options = buildRedisOptions(normalizedUrl);

    redis = new Redis(options);

    redis.on("ready", () => {
      console.log("Redis connected");
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }

  return redis;
};

module.exports = { getRedis };