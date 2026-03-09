const { WalletService } = require("../wallet/walletService");
const Transaction = require("../models/Transaction");

const walletService = new WalletService();

const getBalance = async (req, res) => {
  try {
    const wallet = await walletService.getWallet(req.user.id);
    res.json(wallet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deposit = async (req, res) => {
  try {
    const { amount, utr } = req.body;
    const tx = await walletService.createDepositRequest(req.user.id, amount, utr);
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const withdraw = async (req, res) => {
  try {
    const { amount, upiId } = req.body;
    const tx = await walletService.createWithdrawalRequest(req.user.id, amount, upiId);
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const history = async (req, res) => {
  const data = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(data);
};

module.exports = { getBalance, deposit, withdraw, history };