require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { buildApp } = require("./app");
const { connectMongo } = require("./config/mongo");
const { getRedis } = require("./config/redis");
const { createInMemoryRedis } = require("./services/inMemoryRedis");
const { bindGameSocket } = require("./sockets/gameSocket");

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/$/, "");

const bootstrap = async () => {
  const app = buildApp();
  const server = http.createServer(app);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : true
    },
    transports: ["websocket", "polling"]
  });

  await connectMongo(process.env.MONGO_URI);

  let redis;
  try {
    redis = getRedis(process.env.REDIS_URL);
    await redis.ping();
    console.log("Redis PING successful");
  } catch (err) {
    console.error("Redis unavailable. Falling back to in-memory cache:", err.message);
    if (redis?.disconnect) redis.disconnect();
    redis = createInMemoryRedis();
  }

  bindGameSocket(io, redis);

  const port = Number(process.env.PORT || 4000);
  server.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
};

bootstrap().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});