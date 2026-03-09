const crypto = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const makeStableUserToken = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 18);

class WalletService {
  async resolveUser(userKey) {
    const externalId = String(userKey || "").trim();
    if (!externalId) throw new Error("Invalid user id");

    let user = await User.findOne({ externalId });
    if (!user) {
      const token = makeStableUserToken(externalId);
      try {
        user = await User.create({
          externalId,
          username: `player_${token}`,
          email: `${token}@ludo.local`
        });
      } catch (err) {
        if (err?.code === 11000) {
          user = await User.findOne({ externalId });
        } else {
          throw err;
        }
      }
    }

    if (!user) throw new Error("User provisioning failed");
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