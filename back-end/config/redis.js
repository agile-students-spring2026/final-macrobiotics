import "./env.js";
import redis from "redis";

const redisClient = process.env.REDIS_URL
  ? redis.createClient({
      url: process.env.REDIS_URL,
    })
  : null;

if (redisClient) {
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
}

export const ensureRedisConnection = async () => {
  if (!redisClient) {
    return null;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
};

export default redisClient;
