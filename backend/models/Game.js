const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    players: [{ type: String, required: true }],
    entryFee: { type: Number, required: true },
    winner: { type: String, default: null },
    result: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);