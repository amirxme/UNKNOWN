const MINT_ADDRESS = process.env.UNKNOWN_MINT_ADDRESS;

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (!MINT_ADDRESS) {
        return res.status(200).json({
            success: true,
            launched: false,
            holders: []
        });
    }

    try {

        const response = await fetch(
            `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: "unknown",
                    method: "getTokenLargestAccounts",
                    params: [MINT_ADDRESS]
                })
            }
        );

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(
                data.error?.message ||
                "Failed to load holders"
            );
        }

        const accounts =
            data.result?.value || [];

        const holders = [];

        for (const account of accounts) {

            holders.push({
                address: account.address,
                amount: account.amount,
                decimals: account.decimals
            });
        }

        return res.status(200).json({
            success: true,
            launched: true,
            holders
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Failed to load holders"
        });
    }
}