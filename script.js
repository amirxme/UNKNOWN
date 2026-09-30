let connectedWallet = null;
let isHolder = false;

const pressButton = document.getElementById("pressButton");
const walletButton = document.getElementById("walletButton");
const walletModal = document.getElementById("walletModal");
const closeWallet = document.getElementById("closeWallet");
const walletAddress = document.getElementById("walletAddress");
const statusText = document.getElementById("status");
const countText = document.getElementById("count");

let currentCount = 0;


/* =========================
   WALLET
========================= */

function shortenWallet(wallet) {

    if (!wallet) return "";

    return (
        wallet.slice(0, 4) +
        "..." +
        wallet.slice(-4)
    );
}


function setConnectedWallet(wallet) {

    connectedWallet = wallet;

    if (walletButton) {

        walletButton.textContent =
            shortenWallet(wallet);

    }
}


/* =========================
   HOLDER CHECK
========================= */

async function verifyHolder() {

    if (!connectedWallet) {

        isHolder = false;

        return false;
    }

    try {

        const response =
            await fetch(
                `/api/holders?wallet=${encodeURIComponent(
                    connectedWallet
                )}`
            );

        const data =
            await response.json();

        isHolder =
            data?.success === true &&
            data?.holder === true;

        updatePressButton();

        return isHolder;

    } catch (error) {

        console.error(
            "Holder check failed:",
            error
        );

        isHolder = false;

        updatePressButton();

        return false;
    }
}


/* =========================
   PRESS BUTTON STATE
========================= */

function updatePressButton() {

    if (!pressButton) return;


    if (!connectedWallet) {

        pressButton.disabled = true;

        pressButton.textContent =
            "CONNECT WALLET";

        return;
    }


    if (!isHolder) {

        pressButton.disabled = true;

        pressButton.textContent =
            "HOLDER ACCESS REQUIRED";

        return;
    }


    pressButton.disabled = false;

    pressButton.textContent =
        "PRESS";
}


/* =========================
   WALLET CONNECT
========================= */

async function connectWallet() {

    if (!window.solana) {

        alert(
            "Solana wallet not found."
        );

        return;
    }


    try {

        const response =
            await window.solana.connect();

        const publicKey =
            response.publicKey?.toString();


        if (!publicKey) {

            return;
        }


        setConnectedWallet(
            publicKey
        );


        walletModal?.classList.remove(
            "active"
        );


        await verifyHolder();


    } catch (error) {

        console.error(
            "Wallet connection failed:",
            error
        );
    }
}


/* =========================
   WALLET DISCONNECT
========================= */

async function disconnectWallet() {

    try {

        if (window.solana?.disconnect) {

            await window.solana.disconnect();

        }

    } catch (error) {

        console.error(error);

    }


    connectedWallet = null;

    isHolder = false;


    if (walletButton) {

        walletButton.textContent =
            "CONNECT WALLET";

    }


    updatePressButton();
}


/* =========================
   SIGN MESSAGE
========================= */

async function signMessage() {

    if (!connectedWallet) {

        throw new Error(
            "Wallet not connected"
        );

    }


    const message =
        `UNKNOWN PRESS ${Date.now()}`;


    const encodedMessage =
        new TextEncoder().encode(
            message
        );


    const signed =
        await window.solana.signMessage(
            encodedMessage,
            "utf8"
        );


    const signature =
        btoa(
            String.fromCharCode(
                ...signed.signature
            )
        );


    return {
        message,
        signature
    };
}


/* =========================
   PRESS
========================= */

async function press() {

    if (!connectedWallet) {

        await connectWallet();

        return;
    }


    /*
     * SECOND HOLDER CHECK
     */

    const holder =
        await verifyHolder();


    if (!holder) {

        if (statusText) {

            statusText.textContent =
                "HOLDER ACCESS REQUIRED";

        }

        return;
    }


    if (pressButton) {

        pressButton.disabled = true;

        pressButton.textContent =
            "PRESSING...";
    }


    try {

        const {
            message,
            signature
        } = await signMessage();


        const response =
            await fetch(
                "/api/press",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        wallet:
                            connectedWallet,

                        message,

                        signature

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (statusText) {

                statusText.textContent =
                    data?.error ||
                    "Something went wrong";
            }

            return;
        }


        currentCount =
            Number(
                data.count
            ) || currentCount;


        if (countText) {

            countText.textContent =
                currentCount.toLocaleString();
        }


        if (statusText) {

            statusText.textContent =
                "PRESS RECORDED";
        }


    } catch (error) {

        console.error(
            "Press failed:",
            error
        );


        if (statusText) {

            statusText.textContent =
                "Transaction failed";
        }


    } finally {

        updatePressButton();

    }
}


/* =========================
   LOAD COUNT
========================= */

async function loadCount() {

    try {

        const response =
            await fetch(
                "/api/press"
            );


        const data =
            await response.json();


        if (
            data?.success &&
            typeof data.count !==
                "undefined"
        ) {

            currentCount =
                Number(
                    data.count
                ) || 0;


            if (countText) {

                countText.textContent =
                    currentCount.toLocaleString();

            }

        }

    } catch (error) {

        console.error(
            "Count loading failed:",
            error
        );

    }
}


/* =========================
   EVENTS
========================= */

walletButton?.addEventListener(
    "click",
    connectWallet
);


closeWallet?.addEventListener(
    "click",
    () => {

        walletModal?.classList.remove(
            "active"
        );

    }
);


pressButton?.addEventListener(
    "click",
    press
);


/* =========================
   INIT
========================= */

updatePressButton();

loadCount();


if (
    window.solana &&
    window.solana.isPhantom
) {

    window.solana.on(
        "connect",
        async () => {

            const wallet =
                window.solana.publicKey?.toString();

            if (!wallet) return;

            setConnectedWallet(
                wallet
            );

            await verifyHolder();

        }
    );


    window.solana.on(
        "disconnect",
        disconnectWallet
    );
}