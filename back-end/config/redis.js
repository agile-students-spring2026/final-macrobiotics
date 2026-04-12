import "./env.js";
import redis from "redis";

if (!process.env.REDIS_URL) {
  console.error("Error: REDIS_URL not set in environment variables.");
  process.exit(1);
}

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

export default redisClient;
