const withExpiry = (store, key, value, ttlSeconds) => {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  store.set(key, { value, expiresAt });
};

const readWithExpiry = (store, key) => {
  const found = store.get(key);
  if (!found) return null;
  if (found.expiresAt && found.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return found.value;
};

class InMemoryRedis {
  constructor() {
    this.kv = new Map();
    this.lists = new Map();
    this.hashes = new Map();
  }

  async ping() {
    return "PONG";
  }

  async set(key, value, mode, ttlSeconds) {
    if (mode === "EX" && Number.isFinite(ttlSeconds)) {
      withExpiry(this.kv, key, value, ttlSeconds);
    } else {
      withExpiry(this.kv, key, value, null);
    }
    return "OK";
  }

  async get(key) {
    return readWithExpiry(this.kv, key);
  }

  async del(key) {
    this.kv.delete(key);
    this.lists.delete(key);
    this.hashes.delete(key);
    return 1;
  }

  async rpush(key, value) {
    const list = this.lists.get(key) || [];
    list.push(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lpop(key) {
    const list = this.lists.get(key) || [];
    const value = list.shift();
    this.lists.set(key, list);
    return value ?? null;
  }

  async hincrby(key, field, increment) {
    const hash = this.hashes.get(key) || {};
    hash[field] = Number(hash[field] || 0) + Number(increment || 0);
    this.hashes.set(key, hash);
    return hash[field];
  }

  async hgetall(key) {
    return this.hashes.get(key) || {};
  }

  async expire(_key, _seconds) {
    return 1;
  }

  disconnect() {
    return undefined;
  }

  async quit() {
    return "OK";
  }
}

const createInMemoryRedis = () => new InMemoryRedis();

module.exports = { createInMemoryRedis };