const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Game = require("../models/Game");
const { WalletService } = require("../wallet/walletService");

const walletService = new WalletService();

const approveTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { approved } = req.body;
    const result = await walletService.approveTransaction(transactionId, approved, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const listUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users);
};

const listGames = async (_req, res) => {
  const games = await Game.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(games);
};

const pendingTransactions = async (_req, res) => {
  const txs = await Transaction.find({ status: "pending" }).sort({ createdAt: 1 }).lean();
  res.json(txs);
};

const banUser = async (req, res) => {
  const { userId } = req.params;
  const { banned } = req.body;
  const user = await User.findByIdAndUpdate(userId, { banned: !!banned }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
};

const adjustWallet = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.walletBalance += Number(amount || 0);
  await user.save();

  return res.json(user);
};

module.exports = {
  approveTransaction,
  listUsers,
  listGames,
  pendingTransactions,
  banUser,
  adjustWallet
};