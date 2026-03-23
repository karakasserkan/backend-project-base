const { Redis } = require("@upstash/redis");
const config = require("../config");

const redis = new Redis({
  url: config.REDIS.URL,
  token: config.REDIS.TOKEN,
});

class Cache {
  static async set(key, value, ttlSeconds = 300) {
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch {
      /* Redis yoksa sessizce geç */
    }
  }

  static async get(key) {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return null;
    }
  }

  static async del(key) {
    try {
      await redis.del(key);
    } catch {
      /* sessizce geç */
    }
  }

  static async delByPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      /* sessizce geç */
    }
  }

  static async blacklistToken(token, ttlSeconds) {
    try {
      await redis.set(`blacklist:${token}`, "1", { ex: ttlSeconds });
    } catch {
      /* sessizce geç */
    }
  }

  static async isTokenBlacklisted(token) {
    try {
      const result = await redis.get(`blacklist:${token}`);
      return result !== null;
    } catch {
      return false;
    }
  }
}

module.exports = Cache;
