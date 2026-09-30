import { Redis } from "@upstash/redis";
import nacl from "tweetnacl";
import bs58 from "bs58";

const redis = Redis.fromEnv();

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            wallet,
            message,
            signature
        } = req.body;

        if (!wallet || !message || !signature) {
            return res.status(400).json({
                error: "Missing wallet, message or signature"
            });
        }

        const publicKey = bs58.decode(wallet);

        const signedMessage =
            new TextEncoder().encode(message);

        const signatureBytes =
            Buffer.from(signature, "base64");

        const valid =
            nacl.sign.detached.verify(
                signedMessage,
                signatureBytes,
                publicKey
            );

        if (!valid) {
            return res.status(401).json({
                error: "Invalid signature"
            });
        }

        const alreadyPressed =
            await redis.get(
                `unknown:wallet:${wallet}`
            );

        if (alreadyPressed) {
            return res.status(400).json({
                error: "This wallet already pressed"
            });
        }

        const count =
            await redis.incr("unknown:count");

        await redis.set(
            `unknown:wallet:${wallet}`,
            count
        );

        return res.status(200).json({
            success: true,
            count
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}