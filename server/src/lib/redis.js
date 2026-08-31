/**
 * server/src/lib/redis.js
 * ========================
 * Resilient Redis Client and Cache Layer.
 *
 * Features:
 *  - Connects to Redis via ioredis when REDIS_URL is configured.
 *  - Graceful fallback: If REDIS_URL is omitted or Redis is down, seamlessly
 *    falls back to an in-memory TTL Map without crashing or failing requests.
 *  - Strongly-typed JSON serialization & deserialization helpers.
 *  - Key-pattern deletion for cache invalidation.
 *  - Graceful shutdown helper for SIGTERM / SIGINT.
 */

import Redis from 'ioredis';
import { config } from '../config/env.js';

/**
 * In-memory fallback cache entry structure.
 * @typedef {{ value: string, expiresAt: number }} CacheEntry
 */

/** @type {Map<string, CacheEntry>} */
const inMemoryStore = new Map();

/**
 * Periodic cleanup of expired in-memory items (every 60 seconds).
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.expiresAt && entry.expiresAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}, 60000).unref();

let redisClient = null;
let isConnected = false;

if (config.redisUrl && !config.isTest) {
  try {
    let connectionOptions = {};
    const rawUrl = config.redisUrl.trim();
    if (rawUrl.startsWith('redis://') || rawUrl.startsWith('rediss://')) {
      const parsed = new URL(rawUrl);
      const isTls = parsed.protocol === 'rediss:';
      connectionOptions = {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username ? decodeURIComponent(parsed.username) : 'default',
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
      };
    } else {
      connectionOptions = {
        host: rawUrl.split(':')[0],
        port: parseInt(rawUrl.split(':')[1] || '6379', 10),
      };
    }

    redisClient = new Redis({
      ...connectionOptions,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      enableOfflineQueue: true,
      retryStrategy(times) {
        if (times > 5) {
          console.warn('⚠️ [REDIS] Reconnection retries exhausted. Using in-memory fallback.');
          return null;
        }
        const delay = Math.min(times * 500, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('⚡ [REDIS] Connected successfully to Redis server.');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('⚡ [REDIS] Client is ready to accept commands.');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.warn(`⚠️ [REDIS WARNING] ${err.message}. Operating with in-memory fallback.`);
    });

    redisClient.on('close', () => {
      isConnected = false;
    });
  } catch (err) {
    console.warn(`⚠️ [REDIS INIT] Failed to initialize Redis: ${err.message}. Falling back to in-memory.`);
    redisClient = null;
    isConnected = false;
  }
} else if (!config.redisUrl && !config.isTest) {
  console.log('ℹ️ [REDIS] No REDIS_URL configured. Operating with in-memory cache fallback.');
}

/**
 * Retrieve cached JSON value by key.
 *
 * @template T
 * @param {string} key
 * @returns {Promise<T|null>}
 */
export async function getCache(key) {
  if (!key) return null;

  if (redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`⚠️ [REDIS GET ERROR] key "${key}": ${err.message}`);
    }
  }

  // In-memory fallback
  const entry = inMemoryStore.get(key);
  if (entry) {
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      inMemoryStore.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Store value in cache with TTL.
 *
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Time-to-live in seconds (default: 86400 / 24h)
 * @returns {Promise<boolean>}
 */
export async function setCache(key, value, ttlSeconds = 86400) {
  if (!key || value === undefined) return false;

  const serialized = JSON.stringify(value);

  // Always keep in-memory up to date as backup
  inMemoryStore.set(key, {
    value: serialized,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Infinity,
  });

  if (redisClient) {
    try {
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.warn(`⚠️ [REDIS SET ERROR] key "${key}": ${err.message}`);
      return false;
    }
  }

  return true;
}

/**
 * Delete a specific key from cache.
 *
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function delCache(key) {
  if (!key) return false;

  inMemoryStore.delete(key);

  if (redisClient) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.warn(`⚠️ [REDIS DEL ERROR] key "${key}": ${err.message}`);
      return false;
    }
  }

  return true;
}

/**
 * Invalidate all keys matching a prefix/pattern (e.g. "user:profile:*").
 *
 * @param {string} pattern - Glob pattern or prefix
 * @returns {Promise<number>} Number of keys deleted
 */
export async function delPattern(pattern) {
  if (!pattern) return 0;

  // Clear in-memory matching keys
  const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
  let inMemoryDeleted = 0;
  for (const key of inMemoryStore.keys()) {
    if (regex.test(key)) {
      inMemoryStore.delete(key);
      inMemoryDeleted++;
    }
  }

  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        return keys.length;
      }
    } catch (err) {
      console.warn(`⚠️ [REDIS DEL PATTERN ERROR] pattern "${pattern}": ${err.message}`);
    }
  }

  return inMemoryDeleted;
}

/**
 * Check if Redis is actively connected.
 *
 * @returns {boolean}
 */
export function isRedisConnected() {
  return isConnected;
}

/**
 * Gracefully disconnect Redis client.
 *
 * @returns {Promise<void>}
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('🔌 Disconnected Redis client.');
    } catch {
      redisClient.disconnect();
    }
  }
}

export default {
  get: getCache,
  set: setCache,
  del: delCache,
  delPattern,
  isConnected: isRedisConnected,
  disconnect: disconnectRedis,
};
