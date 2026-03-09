const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { auth, adminOnly } = require("./middleware/auth");
const { apiLimiter } = require("./middleware/rateLimit");

const walletRoutes = require("./routes/walletRoutes");
const adminRoutes = require("./routes/adminRoutes");
const systemRoutes = require("./routes/systemRoutes");

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/$/, "");

const buildCorsOptions = () => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    }
  };
};

const buildApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "1mb" }));
  app.use(apiLimiter);

  app.use("/api", systemRoutes);
  app.use("/api/wallet", auth, walletRoutes);
  app.use("/api/admin", auth, adminOnly, adminRoutes);

  return app;
};

module.exports = { buildApp };