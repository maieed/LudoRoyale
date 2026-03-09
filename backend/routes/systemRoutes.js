const express = require("express");
const healthRouter = express.Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

module.exports = healthRouter;