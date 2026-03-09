const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "withdrawal", "entry_fee", "prize"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
    reference: { type: String },
    metadata: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);