import { Redis } from '@upstash/redis';

// Initialize Redis client from env vars
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default redis;
