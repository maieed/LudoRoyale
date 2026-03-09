require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { buildApp } = require("./app");
const { connectMongo } = require("./config/mongo");
const { getRedis } = require("./config/redis");
const { bindGameSocket } = require("./sockets/gameSocket");

const bootstrap = async () => {
  const app = buildApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || "").split(",")
    },
    transports: ["websocket", "polling"]
  });

  await connectMongo(process.env.MONGO_URI);
  const redis = getRedis(process.env.REDIS_URL);

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