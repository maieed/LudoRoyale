const Game = require("../models/Game");

class GameStateService {
  constructor(redis) {
    this.redis = redis;
  }

  async saveState(roomId, state) {
    await this.redis.set(`room:${roomId}`, JSON.stringify(state), "EX", 3600);
  }

  async getState(roomId) {
    const state = await this.redis.get(`room:${roomId}`);
    return state ? JSON.parse(state) : null;
  }

  async removeState(roomId) {
    await this.redis.del(`room:${roomId}`);
  }

  async persistGameResult(state) {
    return Game.findOneAndUpdate(
      { roomId: state.roomId },
      {
        roomId: state.roomId,
        players: state.players.map((p) => p.id),
        entryFee: state.entryFee,
        winner: state.winner,
        result: state
      },
      { upsert: true, new: true }
    );
  }
}

module.exports = { GameStateService };