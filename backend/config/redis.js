const Redis = require("ioredis");

let redis;

const stripSurroundingQuotes = (value) => {
  if (!value) return value;
  const trimmed = String(value).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const extractRedisUrl = (rawValue) => {
  const value = stripSurroundingQuotes(rawValue);
  if (!value) {
    throw new Error("REDIS_URL is missing");
  }

  // Supports accidental values like: redis-cli --tls -u rediss://...
  if (value.includes("redis-cli") && value.includes("-u")) {
    const parts = value.split(/\s+/);
    const urlIndex = parts.findIndex((part) => part === "-u");
    if (urlIndex >= 0 && parts[urlIndex + 1]) {
      return stripSurroundingQuotes(parts[urlIndex + 1]);
    }
  }

  const match = value.match(/rediss?:\/\/\S+/i);
  if (match) {
    return stripSurroundingQuotes(match[0]);
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
    tlsEnabled: parsed.protocol === "rediss:",
    options: {
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
    }
  };
};

const applyExplicitAuthOnConnect = (client, username, password) => {
  if (!password) return;

  client.on("connect", () => {
    const authPromise = username ? client.auth(username, password) : client.auth(password);
    authPromise.catch((err) => {
      console.error("Redis explicit auth failed:", err.message);
    });
  });
};

const getRedis = (redisUrl) => {
  if (!redis) {
    const normalizedUrl = extractRedisUrl(redisUrl);
    const { username, password, tlsEnabled, options } = buildRedisOptions(normalizedUrl);

    redis = new Redis(options);
    applyExplicitAuthOnConnect(redis, username, password);

    console.log(
      `Redis config host=${options.host} port=${options.port} tls=${tlsEnabled} authUser=${Boolean(username)} authPass=${Boolean(password)}`
    );

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