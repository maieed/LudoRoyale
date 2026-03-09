const { v4: uuidv4 } = require("uuid");
const { createInitialState } = require("../game-engine/ludoEngine");

const queueKey = (entryFee) => `mm:queue:${entryFee}`;

class MatchmakingService {
  constructor(redis) {
    this.redis = redis;
  }

  async joinQueue({ userId, entryFee, socketId, botDifficulty = "medium" }) {
    const payload = JSON.stringify({
      userId,
      entryFee,
      socketId,
      joinedAt: Date.now(),
      botDifficulty
    });

    await this.redis.rpush(queueKey(entryFee), payload);
    return { queued: true };
  }

  async findOrCreateMatch({ userId, entryFee, waitSeconds = 8 }) {
    const start = Date.now();
    const qKey = queueKey(entryFee);

    while (Date.now() - start < waitSeconds * 1000) {
      const first = await this.redis.lpop(qKey);
      if (!first) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      const p1 = JSON.parse(first);
      if (p1.userId === userId) {
        const second = await this.redis.lpop(qKey);
        if (!second) {
          await this.redis.rpush(qKey, JSON.stringify(p1));
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        const p2 = JSON.parse(second);
        const roomId = uuidv4();
        return {
          found: true,
          roomId,
          players: [
            { id: p1.userId, type: "human", socketId: p1.socketId },
            { id: p2.userId, type: "human", socketId: p2.socketId }
          ]
        };
      }

      const roomId = uuidv4();
      return {
        found: true,
        roomId,
        players: [
          { id: userId, type: "human" },
          { id: p1.userId, type: "human", socketId: p1.socketId }
        ]
      };
    }

    const roomId = uuidv4();
    const botId = `bot-${roomId.slice(0, 8)}`;
    return {
      found: false,
      roomId,
      players: [
        { id: userId, type: "human" },
        { id: botId, type: "bot", difficulty: "medium" }
      ]
    };
  }

  async createRoomState(players, entryFee, forcedRoomId) {
    const state = createInitialState(players, entryFee);
    if (forcedRoomId) {
      state.roomId = forcedRoomId;
    }
    await this.redis.set(`room:${state.roomId}`, JSON.stringify(state), "EX", 3600);
    return state;
  }
}

module.exports = { MatchmakingService };