const { Redis } = require("@upstash/redis");
const config = require("../config");

const redis = new Redis({
  url: config.REDIS.URL,
  token: config.REDIS.TOKEN,
});

class Cache {
  // Veri kaydet
  static async set(key, value, ttlSeconds = 300) {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  }

  // Veri oku
  static async get(key) {
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return data;
    }
  }

  // Veri sil
  static async del(key) {
    await redis.del(key);
  }

  // Pattern ile sil — örn: "categories:*"
  static async delByPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  }

  // Token blacklist'e ekle — logout için
  static async blacklistToken(token, ttlSeconds) {
    await redis.set(`blacklist:${token}`, "1", { ex: ttlSeconds });
  }

  // Token blacklist'te mi?
  static async isTokenBlacklisted(token) {
    const result = await redis.get(`blacklist:${token}`);
    return result !== null;
  }
}

module.exports = Cache;
