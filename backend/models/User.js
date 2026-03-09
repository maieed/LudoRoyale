const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 },
    banned: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);