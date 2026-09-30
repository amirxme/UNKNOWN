const UNKNOWN_MINT = "Bb1KCmH6TpMomqdpUhWRqKr7XwQU9bocnNNPj5yUpump";
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

async function isHolder(wallet) {

    const response =
        await fetch(
            SOLANA_RPC,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method:
                        "getTokenAccountsByOwner",

                    params: [
                        wallet,

                        {
                            mint: UNKNOWN_MINT
                        },

                        {
                            encoding:
                                "jsonParsed"
                        }
                    ]
                })
            }
        );

    if (!response.ok) {
        throw new Error(
            "Solana RPC unavailable"
        );
    }

    const data =
        await response.json();

    const accounts =
        data?.result?.value || [];

    return accounts.some(
        account => {

            const amount =
                account?.account?.data?.parsed
                    ?.info?.tokenAmount?.uiAmount;

            return Number(amount) > 0;
        }
    );
}


export default async function handler(
    req,
    res
) {

    if (req.method === "GET") {

        return res.status(200).json({
            success: true,
            launched: true,
            holders: []
        });
    }


    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }


    try {

        const {
            wallet
        } = req.body || {};


        if (!wallet) {

            return res.status(400).json({
                success: false,
                error: "Wallet required"
            });
        }


        const holder =
            await isHolder(wallet);


        return res.status(200).json({
            success: true,
            holder
        });


    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error:
                "Unable to verify holder"
        });
    }
}