import { createClient } from "redis"

type RedisClient = ReturnType<typeof createClient>

const globalForRedis = global as typeof globalThis & {
  _redis?: RedisClient
}

export async function getRedisClient(): Promise<RedisClient> {
  if (globalForRedis._redis) {
    return globalForRedis._redis
  }

  const client = createClient({ url: process.env.REDIS_URL })
  client.on("error", (err: unknown) => {
    console.error("Redis client error:", err)
  })

  await client.connect()
  globalForRedis._redis = client

  return client
}

export function buildCacheKey(ip: string): string {
  return `ip:lookup:${ip}`
}

export const CACHE_TTL = 86400
