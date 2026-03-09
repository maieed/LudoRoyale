const auth = (req, res, next) => {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({ error: "Missing x-user-id" });
  }

  const isAdmin = req.header("x-admin-key") && req.header("x-admin-key") === process.env.ADMIN_API_KEY;
  req.user = {
    id: userId,
    isAdmin
  };
  return next();
};

const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
};

module.exports = { auth, adminOnly };