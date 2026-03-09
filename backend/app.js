const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { auth, adminOnly } = require("./middleware/auth");
const { apiLimiter } = require("./middleware/rateLimit");

const walletRoutes = require("./routes/walletRoutes");
const adminRoutes = require("./routes/adminRoutes");
const systemRoutes = require("./routes/systemRoutes");

const buildApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || "").split(",") }));
  app.use(express.json({ limit: "1mb" }));
  app.use(apiLimiter);

  app.use("/api", systemRoutes);
  app.use("/api/wallet", auth, walletRoutes);
  app.use("/api/admin", auth, adminOnly, adminRoutes);

  return app;
};

module.exports = { buildApp };