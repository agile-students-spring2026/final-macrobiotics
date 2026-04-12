import "./env.js";
import redis from "redis";

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().then(() => {
  console.log("Connected to Redis at", process.env.REDIS_URL.split("@")[1]);
});

export default redisClient;
