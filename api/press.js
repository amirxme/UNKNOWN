import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    try {
        const test = await redis.incr("unknown:test");

        return res.status(200).json({
            success: true,
            redis: true,
            test
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            redis: false,
            error: error.message
        });
    }
}