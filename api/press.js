import { Redis } from "@upstash/redis";
import nacl from "tweetnacl";
import bs58 from "bs58";

const redis = Redis.fromEnv();

const UNKNOWN_MINT = "Bb1KCmH6TpMomqdpUhWRqKr7XwQU9bocnNNPj5yUpump";
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

async function isHolder(wallet) {
    const response = await fetch(SOLANA_RPC, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
                wallet,
                {
                    mint: UNKNOWN_MINT
                },
                {
                    encoding: "jsonParsed"
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error("Solana RPC unavailable");
    }

    const data = await response.json();
    const accounts = data?.result?.value || [];

    return accounts.some(account => {
        const amount =
            account?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;

        return Number(amount) > 0;
    });
}

export default async function handler(req, res) {

    if (req.method === "GET") {

        const count =
            Number(await redis.get("unknown:count")) || 0;

        return res.status(200).json({
            success: true,
            count
        });
    }

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

        const result = await redis.eval(
    `
    local count = tonumber(redis.call("GET", KEYS[1]) or "0")

    if count >= tonumber(ARGV[1]) then
        return -2
    end

    local claimed = redis.call(
        "SET",
        KEYS[2],
        "processing",
        "NX"
    )

    if not claimed then
        return -1
    end

    local newCount =
        redis.call("INCR", KEYS[1])

    redis.call(
        "SET",
        KEYS[2],
        newCount
    )

    return newCount
    `,
    [
        "unknown:count",
        `unknown:wallet:${wallet}`
    ],
    [10000]
);

if (Number(result) === -1) {
    return res.status(400).json({
        error: "This wallet already pressed"
    });
}

if (Number(result) === -2) {
    return res.status(400).json({
        error: "Experiment completed"
    });
}

const count = Number(result);

        await redis.lpush(
            "unknown:activity",
            JSON.stringify({
                wallet,
                count,
                timestamp: Date.now()
            })
        );

        await redis.ltrim(
            "unknown:activity",
            0,
            2
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