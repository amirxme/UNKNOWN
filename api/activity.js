import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const items =
            await redis.lrange(
                "unknown:activity",
                0,
                2
            );

        const activity =
            items.map(item => {
                try {
                    return typeof item === "string"
                        ? JSON.parse(item)
                        : item;
                } catch {
                    return null;
                }
            }).filter(Boolean);

        return res.status(200).json({
            success: true,
            activity
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}