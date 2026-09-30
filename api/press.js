import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const count = await redis.incr("unknown:count");

        return res.status(200).json({
            success: true,
            count
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            error: "Database error"
        });

    }
}