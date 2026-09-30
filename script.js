const TARGET = 10000;

let count = 0;
let connectedWallet = null;
let isHolder = false;
let walletProvider = null;
let pressing = false;

/* ELEMENTS */

const pressButton = document.getElementById("pressButton");
const currentCount = document.getElementById("currentCount");
const progressFill = document.getElementById("progressFill");
const activityList = document.getElementById("activityList");

const leaderboardButton =
    document.getElementById("leaderboardButton");

const leaderboardOverlay =
    document.getElementById("leaderboardOverlay");

const closeLeaderboard =
    document.getElementById("closeLeaderboard");

const walletButton =
    document.getElementById("walletButton");

const walletOverlay =
    document.getElementById("walletOverlay");

const closeWallet =
    document.getElementById("closeWallet");

const phantomButton =
    document.getElementById("phantomButton");

const solflareButton =
    document.getElementById("solflareButton");

const backpackButton =
    document.getElementById("backpackButton");

const walletStatus =
    document.getElementById("walletStatus");


/* COUNTER */

let counterAnimationFrame = null;

function updateCounter(animate = false) {

    const targetCount = count;

if (counterAnimationFrame) {
    cancelAnimationFrame(counterAnimationFrame);
    counterAnimationFrame = null;
}

if (!animate) {

    currentCount.textContent =
        targetCount.toLocaleString("en-US");

} else {

    const currentValue =
        Number(
            currentCount.textContent.replace(/,/g, "")
        ) || 0;

    const startTime = performance.now();
    const duration = 400;

    function animateCount(now) {

        const progress = Math.min(
            (now - startTime) / duration,
            1
        );

        const eased =
            1 - Math.pow(1 - progress, 3);

        const value = Math.round(
            currentValue +
            (targetCount - currentValue) * eased
        );

        currentCount.textContent =
            value.toLocaleString("en-US");

        if (progress < 1) {

            counterAnimationFrame =
                requestAnimationFrame(animateCount);

        } else {

            counterAnimationFrame = null;
        }
    }

    counterAnimationFrame =
        requestAnimationFrame(animateCount);
}

const progress =
    Math.min(
        (targetCount / TARGET) * 100,
        100
    );

progressFill.style.width =
    `${progress}%`;
}


/* BUTTON PULSE */

function buttonPulse() {

    pressButton.classList.remove("pulse");

    void pressButton.offsetWidth;

    pressButton.classList.add("pulse");

    setTimeout(() => {
        pressButton.classList.remove("pulse");
    }, 450);
}


/* ADDRESS */

function shortenAddress(address) {

    return (
        address.slice(0, 4) +
        "..." +
        address.slice(-4)
    );
}


/* ACTIVITY */

function addActivity(wallet) {

    const item =
        document.createElement("div");

    item.className =
        "activity-empty";

    item.style.opacity = "0";
    item.style.transform =
        "translateY(-6px)";

    item.textContent =
        `${shortenAddress(wallet)} pressed`;

    activityList.prepend(item);

    requestAnimationFrame(() => {

        item.style.transition =
            "opacity .35s ease, transform .35s ease";

        item.style.opacity = "1";

        item.style.transform =
            "translateY(0)";
    });

    while (
        activityList.children.length > 3
    ) {
        activityList.removeChild(
            activityList.lastChild
        );
    }
}


function renderActivity(activity) {

    activityList.innerHTML = "";

    if (!Array.isArray(activity)) {
        return;
    }

    activity.forEach(event => {

        if (!event || !event.wallet) {
            return;
        }

        addActivity(event.wallet);
    });
}


/* MOBILE */

function isMobile() {

    return /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );
}


/* PHANTOM */

function getPhantom() {

    if (
        window.phantom &&
        window.phantom.solana
    ) {
        return window.phantom.solana;
    }

    if (
        window.solana &&
        window.solana.isPhantom
    ) {
        return window.solana;
    }

    return null;
}


/* SOLFLARE */

function getSolflare() {

    if (
        window.solflare &&
        typeof window.solflare.connect === "function"
    ) {
        return window.solflare;
    }

    return null;
}


/* BACKPACK */

function getBackpack() {

    if (
        window.backpack &&
        window.backpack.solana
    ) {
        return window.backpack.solana;
    }

    return null;
}


/* MOBILE REDIRECT */

function showOpenButton(walletName, deeplink) {

    walletStatus.innerHTML = `
        <div
            style="
                margin-bottom:12px;
                color:#777d88;
            "
        >
            OPEN THIS SITE INSIDE ${walletName}
        </div>

        <button
            id="openWalletButton"
            style="
                width:100%;
                padding:14px;
                border:1px solid rgba(155,188,255,0.30);
                background:rgba(155,188,255,0.06);
                color:#f2f4f7;
                font-family:inherit;
                font-size:10px;
                letter-spacing:.14em;
                cursor:pointer;
            "
        >
            OPEN IN ${walletName}
        </button>
    `;

    const openButton =
        document.getElementById(
            "openWalletButton"
        );

    openButton.addEventListener(
        "click",
        () => {
            window.location.href = deeplink;
        }
    );
}


/* PHANTOM REDIRECT */

function openPhantom() {

    const currentUrl =
        window.location.href;

    const encodedUrl =
        encodeURIComponent(currentUrl);

    const deeplink =
        `https://phantom.app/ul/browse/${encodedUrl}`;

    showOpenButton(
        "PHANTOM",
        deeplink
    );
}


/* SOLFLARE REDIRECT */

function openSolflare() {

    const currentUrl =
        window.location.href;

    const encodedUrl =
        encodeURIComponent(currentUrl);

    const ref =
        encodeURIComponent(
            window.location.origin
        );

    const deeplink =
        `https://solflare.com/ul/v1/browse/${encodedUrl}?ref=${ref}`;

    showOpenButton(
        "SOLFLARE",
        deeplink
    );
}


/* BACKPACK REDIRECT */

function openBackpack() {

    const currentUrl =
        window.location.href;

    const encodedUrl =
        encodeURIComponent(currentUrl);

    const ref =
        encodeURIComponent(
            window.location.origin
        );

    const deeplink =
        `https://backpack.app/ul/v1/browse/${encodedUrl}?ref=${ref}`;

    showOpenButton(
        "BACKPACK",
        deeplink
    );
}


/* SET CONNECTED WALLET */

function setConnectedWallet(provider, publicKey) {

    walletProvider = provider;

    connectedWallet =
        publicKey.toString();

    isHolder = false;

    walletStatus.textContent =
        "CHECKING HOLDER STATUS...";

    walletButton.textContent =
        shortenAddress(
            connectedWallet
        );

    pressButton.disabled = true;

    verifyHolder();

    setTimeout(() => {

        walletOverlay.classList.remove(
            "active"
        );

    }, 700);
}
async function verifyHolder() {

    if (!connectedWallet) {
        return;
    }

    try {

        const response =
            await fetch("/api/holders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    wallet: connectedWallet
                })
            });

        const data =
            await response.json();

        isHolder =
            data.success === true &&
            data.holder === true;

        if (isHolder) {

            walletStatus.textContent =
                "HOLDER VERIFIED";

            pressButton.disabled = false;

        } else {

            walletStatus.textContent =
                "HOLDER ACCESS REQUIRED";

            pressButton.disabled = true;
        }

    } catch (error) {

        console.error(
            "Holder verification error:",
            error
        );

        isHolder = false;

        pressButton.disabled = true;

        walletStatus.textContent =
            "HOLDER CHECK FAILED";
    }
}

/* PHANTOM CONNECTION */

async function connectPhantom() {

    const provider =
        getPhantom();

    if (!provider && isMobile()) {

        walletStatus.textContent =
            "OPENING PHANTOM...";

        setTimeout(() => {
            openPhantom();
        }, 300);

        return;
    }

    if (!provider) {

        walletStatus.innerHTML = `
            PHANTOM EXTENSION NOT FOUND
            <br><br>
            <span style="font-size:9px;">
                Open UNKNOWN in a supported desktop browser
                with Phantom installed.
            </span>
        `;

        return;
    }

    try {

        walletStatus.textContent =
            "CONNECTING...";

        const response =
            await provider.connect();

        if (
            !response ||
            !response.publicKey
        ) {

            walletStatus.textContent =
                "WALLET ADDRESS NOT FOUND";

            return;
        }

        setConnectedWallet(
            provider,
            response.publicKey
        );

    } catch (error) {

        console.error(
            "Phantom connection error:",
            error
        );

        walletStatus.textContent =
            "CONNECTION CANCELLED";
    }
}


/* SOLFLARE CONNECTION */

async function connectSolflare() {

    const provider =
        getSolflare();

    if (!provider && isMobile()) {

        walletStatus.textContent =
            "OPENING SOLFLARE...";

        setTimeout(() => {
            openSolflare();
        }, 300);

        return;
    }

    if (!provider) {

        walletStatus.textContent =
            "SOLFLARE NOT FOUND";

        return;
    }

    try {

        walletStatus.textContent =
            "CONNECTING...";

        const response =
            await provider.connect();

        if (
            !response ||
            !response.publicKey
        ) {

            walletStatus.textContent =
                "WALLET ADDRESS NOT FOUND";

            return;
        }

        setConnectedWallet(
            provider,
            response.publicKey
        );

    } catch (error) {

        console.error(
            "Solflare connection error:",
            error
        );

        walletStatus.textContent =
            "CONNECTION CANCELLED";
    }
}


/* BACKPACK CONNECTION */

async function connectBackpack() {

    const provider =
        getBackpack();

    if (!provider && isMobile()) {

        walletStatus.textContent =
            "OPENING BACKPACK...";

        setTimeout(() => {
            openBackpack();
        }, 300);

        return;
    }

    if (!provider) {

        walletStatus.textContent =
            "BACKPACK NOT FOUND";

        return;
    }

    try {

        walletStatus.textContent =
            "CONNECTING...";

        const response =
            await provider.connect();

        if (
            !response ||
            !response.publicKey
        ) {

            walletStatus.textContent =
                "WALLET ADDRESS NOT FOUND";

            return;
        }

        setConnectedWallet(
            provider,
            response.publicKey
        );

    } catch (error) {

        console.error(
            "Backpack connection error:",
            error
        );

        walletStatus.textContent =
            "CONNECTION CANCELLED";
    }
}


/* SIGNATURE ENCODING */

function uint8ArrayToBase64(bytes) {

    let binary = "";

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}


/* PRESS */

pressButton.addEventListener(
    "click",
    async () => {

        if (pressing) {
            return;
        }

        if (count >= TARGET) {
            return;
        }

        if (!connectedWallet || !walletProvider) {

            walletOverlay.classList.add(
                "active"
            );

            walletStatus.textContent =
                "CONNECT WALLET FIRST";

            return;
        }
if (!isHolder) {

    walletStatus.textContent =
        "HOLDER ACCESS REQUIRED";

    await verifyHolder();

    if (!isHolder) {
        return;
    }
}
        if (
            typeof walletProvider.signMessage !==
            "function"
        ) {

            walletStatus.textContent =
                "SIGN MESSAGE NOT SUPPORTED";

            return;
        }

        try {

            pressing = true;

            pressButton.disabled = true;

            walletStatus.textContent =
                "SIGN TO PRESS...";

            /*
             * Unique message for this wallet.
             * The server verifies that the wallet
             * actually signed this message.
             */

            const message =
                `UNKNOWN PRESS\nWallet: ${connectedWallet}\nTime: ${Date.now()}`;

            const encodedMessage =
                new TextEncoder().encode(
                    message
                );

            const signed =
                await walletProvider.signMessage(
                    encodedMessage,
                    "utf8"
                );

            if (
                !signed ||
                !signed.signature
            ) {

                throw new Error(
                    "Wallet did not return a signature"
                );
            }

            const signature =
                uint8ArrayToBase64(
                    signed.signature
                );

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

                            message:
                                message,

                            signature:
                                signature
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                if (
                    data.error ===
                    "This wallet already pressed"
                ) {

                    walletStatus.textContent =
                        "THIS WALLET ALREADY PRESSED";

                } else {

                    walletStatus.textContent =
                        data.error ||
                        "PRESS FAILED";
                }

                return;
            }

            if (
                !data.success ||
                typeof data.count !== "number"
            ) {

                throw new Error(
                    "Invalid server response"
                );
            }

            count =
                data.count;

            updateCounter(true);

            addActivity(
                connectedWallet
            );

            buttonPulse();

            walletStatus.textContent =
                "PRESS REGISTERED";

            if (count >= TARGET) {
                finishExperiment();
            }

        } catch (error) {

            console.error(
                "PRESS error:",
                error
            );

            if (
                error &&
                error.code === 4001
            ) {

                walletStatus.textContent =
                    "SIGNATURE CANCELLED";

            } else {

                walletStatus.textContent =
                    "PRESS FAILED";
            }

        } finally {

            pressing = false;

            if (count < TARGET) {
                pressButton.disabled = false;
            }
        }
    }
);


/* FINAL EVENT */

function finishExperiment() {

    pressButton.disabled = true;

    setTimeout(() => {

        document.body.innerHTML = `
            <main
                style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    text-align:center;
                    padding:30px;
                    background:#08090c;
                "
            >

                <div>

                    <div
                        style="
                            font-size:10px;
                            letter-spacing:.3em;
                            color:#777d88;
                            margin-bottom:25px;
                        "
                    >
                        UNKNOWN
                    </div>

                    <h1
                        style="
                            font-size:clamp(32px,7vw,70px);
                            font-weight:500;
                            letter-spacing:.08em;
                        "
                    >
                        ...
                    </h1>

                </div>

            </main>
        `;

    }, 2500);
}


/* LEADERBOARD */

async function renderLeaderboard() {

    const list =
        document.getElementById(
            "leaderboardList"
        );

    list.innerHTML = `
        <div style="
            padding:20px 0;
            color:#555b65;
            font-size:10px;
        ">
            LOADING HOLDERS...
        </div>
    `;

    try {

        const response =
            await fetch("/api/holders");

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                "Failed to load holders"
            );
        }

        if (
            !data.launched ||
            !Array.isArray(data.holders) ||
            data.holders.length === 0
        ) {

            list.innerHTML = `
                <div style="
                    padding:35px 0;
                    text-align:center;
                    color:#555b65;
                    font-size:10px;
                    letter-spacing:.14em;
                ">
                    HOLDERS
                    <br><br>
                    COMING SOON
                </div>
            `;

            return;
        }

        list.innerHTML = "";

        data.holders.forEach(
            (holder, index) => {

                const row =
                    document.createElement("div");

                row.style.display = "grid";

                row.style.gridTemplateColumns =
                    "35px 1fr 90px";

                row.style.padding =
                    "14px 0";

                row.style.borderBottom =
                    "1px solid rgba(255,255,255,0.06)";

                row.style.fontSize = "11px";

                const amount =
                    Number(holder.amount) /
                    Math.pow(
                        10,
                        Number(holder.decimals || 0)
                    );

                row.innerHTML = `
                    <span style="color:#555b65">
                        ${String(index + 1).padStart(2, "0")}
                    </span>

                    <span>
                        ${shortenAddress(
                            holder.address
                        )}
                    </span>

                    <span style="
                        text-align:right;
                        color:#777d88;
                    ">
                        ${amount.toLocaleString(
                            "en-US",
                            {
                                maximumFractionDigits: 2
                            }
                        )}
                    </span>
                `;

                list.appendChild(row);
            }
        );

    } catch (error) {

        console.error(
            "Holder leaderboard error:",
            error
        );

        list.innerHTML = `
            <div style="
                padding:25px 0;
                text-align:center;
                color:#777d88;
                font-size:10px;
            ">
                HOLDERS UNAVAILABLE
            </div>
        `;
    }
}


leaderboardButton.addEventListener(
    "click",
    () => {

        renderLeaderboard();

        leaderboardOverlay.classList.add(
            "active"
        );
    }
);


closeLeaderboard.addEventListener(
    "click",
    () => {

        leaderboardOverlay.classList.remove(
            "active"
        );
    }
);


/* WALLET WINDOW */

walletButton.addEventListener(
    "click",
    () => {

        walletOverlay.classList.add(
            "active"
        );

        walletStatus.textContent = "";
    }
);


closeWallet.addEventListener(
    "click",
    () => {

        walletOverlay.classList.remove(
            "active"
        );
    }
);


/* CLOSE OVERLAY */

leaderboardOverlay.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            leaderboardOverlay
        ) {

            leaderboardOverlay.classList.remove(
                "active"
            );
        }
    }
);


walletOverlay.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            walletOverlay
        ) {

            walletOverlay.classList.remove(
                "active"
            );
        }
    }
);


/* BUTTONS */

phantomButton.addEventListener(
    "click",
    connectPhantom
);

solflareButton.addEventListener(
    "click",
    connectSolflare
);

backpackButton.addEventListener(
    "click",
    connectBackpack
);


/* INITIAL */

async function loadCounter() {

    try {

        const response =
            await fetch("/api/press");

        const data =
            await response.json();

        if (
            data.success &&
            typeof data.count === "number"
        ) {
            count = data.count;
            updateCounter();

            if (count >= TARGET) {
                finishExperiment();
            }
        }

        const activityResponse =
            await fetch("/api/activity");

        const activityData =
            await activityResponse.json();

        if (
            activityData.success &&
            Array.isArray(activityData.activity)
        ) {
            renderActivity(
                activityData.activity
            );
        }

    } catch (error) {

        console.error(
            "Counter loading error:",
            error
        );
    }
}

loadCounter();