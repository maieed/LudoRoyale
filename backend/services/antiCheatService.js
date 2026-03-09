class AntiCheatService {
  constructor(redis) {
    this.redis = redis;
  }

  async recordEvent(userId, event) {
    const key = `ac:${userId}:${Math.floor(Date.now() / 60000)}`;
    const count = await this.redis.hincrby(key, event, 1);
    await this.redis.expire(key, 180);
    return count;
  }

  async isSuspicious(userId) {
    const key = `ac:${userId}:${Math.floor(Date.now() / 60000)}`;
    const events = await this.redis.hgetall(key);
    const rolls = Number(events.rollDice || 0);
    const moves = Number(events.moveToken || 0);
    return rolls > 100 || moves > 100;
  }
}

module.exports = { AntiCheatService };