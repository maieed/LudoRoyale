const User = require("../models/User");
const Transaction = require("../models/Transaction");

class WalletService {
  async resolveUser(userKey) {
    let user = await User.findOne({ externalId: userKey });
    if (!user) {
      const safe = String(userKey).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || `u${Date.now()}`;
      user = await User.create({
        externalId: userKey,
        username: `player_${safe}`,
        email: `${safe}@ludo.local`
      });
    }
    if (user.banned) throw new Error("User is banned");
    return user;
  }

  async getWallet(userId) {
    const user = await this.resolveUser(userId);
    return { balance: user.walletBalance };
  }

  async createDepositRequest(userId, amount, utr) {
    const user = await this.resolveUser(userId);
    return Transaction.create({
      userId: user._id,
      type: "deposit",
      amount,
      status: "pending",
      reference: utr,
      metadata: { source: "upi", externalId: user.externalId }
    });
  }

  async createWithdrawalRequest(userId, amount, upiId) {
    const user = await this.resolveUser(userId);
    if (user.walletBalance < amount) throw new Error("Insufficient balance");

    return Transaction.create({
      userId: user._id,
      type: "withdrawal",
      amount,
      status: "pending",
      reference: upiId,
      metadata: { destination: "upi", externalId: user.externalId }
    });
  }

  async approveTransaction(transactionId, approved, adminId) {
    const tx = await Transaction.findById(transactionId);
    if (!tx) throw new Error("Transaction not found");
    if (tx.status !== "pending") throw new Error("Transaction already processed");

    tx.status = approved ? "approved" : "rejected";
    tx.metadata = { ...(tx.metadata || {}), approvedBy: adminId, approvedAt: new Date().toISOString() };
    await tx.save();

    if (approved) {
      const user = await User.findById(tx.userId);
      if (!user) throw new Error("User not found");
      if (tx.type === "deposit") user.walletBalance += tx.amount;
      if (tx.type === "withdrawal") user.walletBalance -= tx.amount;
      await user.save();
      tx.status = "completed";
      await tx.save();
    }

    return tx;
  }

  async deductEntryFee(userId, entryFee, roomId) {
    const user = await this.resolveUser(userId);
    if (user.walletBalance < entryFee) throw new Error("Insufficient wallet balance");

    user.walletBalance -= entryFee;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "entry_fee",
      amount: entryFee,
      status: "completed",
      reference: roomId,
      metadata: { externalId: user.externalId }
    });
  }

  async awardPrize(userId, amount, roomId) {
    const user = await this.resolveUser(userId);
    user.walletBalance += amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "prize",
      amount,
      status: "completed",
      reference: roomId,
      metadata: { externalId: user.externalId }
    });
  }
}

module.exports = { WalletService };