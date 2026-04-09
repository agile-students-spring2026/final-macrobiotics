import "./env.js";
import redis from "redis";

console.log(process.env.REDIS_URL);

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect().then(() => {
  console.log("Connected to Redis");
});

export default redisClient;
