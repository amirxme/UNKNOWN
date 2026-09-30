const TARGET = 50000;

let count = 0;
let connectedWallet = null;


/* ELEMENTS */

const pressButton =
    document.getElementById("pressButton");

const currentCount =
    document.getElementById("currentCount");

const progressFill =
    document.getElementById("progressFill");

const activityList =
    document.getElementById("activityList");

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

function updateCounter() {

    currentCount.textContent =
        count.toLocaleString("en-US");

    const progress =
        (count / TARGET) * 100;

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

function addActivity() {

    const wallet =
        connectedWallet
            ? shortenAddress(connectedWallet)
            : generateWallet();

    const item =
        document.createElement("div");

    item.className =
        "activity-empty";

    item.style.opacity = "0";

    item.style.transform =
        "translateY(-6px)";

    item.textContent =
        `${wallet} pressed`;

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


function generateWallet() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";

    let result = "";

    for (let i = 0; i < 4; i++) {

        result +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];
    }

    result += "...";

    for (let i = 0; i < 3; i++) {

        result +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];
    }

    return result;
}


/* PRESS */

pressButton.addEventListener(
    "click",
    () => {

        if (count >= TARGET) {
            return;
        }

        count++;

        updateCounter();

        addActivity();

        buttonPulse();

        if (count === TARGET) {
            finishExperiment();
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

const leaderboardData = [

    ["7xK...92F", 37],
    ["A91...K2Q", 31],
    ["4Pm...8Ls", 24],
    ["9Qw...L7A", 19],
    ["3Hd...P2M", 15]

];


function renderLeaderboard() {

    const list =
        document.getElementById(
            "leaderboardList"
        );

    list.innerHTML = "";

    leaderboardData.forEach(
        (entry, index) => {

            const row =
                document.createElement("div");

            row.style.display = "grid";

            row.style.gridTemplateColumns =
                "35px 1fr 60px";

            row.style.padding =
                "14px 0";

            row.style.borderBottom =
                "1px solid rgba(255,255,255,0.06)";

            row.style.fontSize =
                "11px";

            row.innerHTML = `

                <span style="color:#555b65">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <span>
                    ${entry[0]}
                </span>

                <span style="text-align:right">
                    ${entry[1]}
                </span>

            `;

            list.appendChild(row);

        }
    );
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


/* MOBILE DETECTION */

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


/* PHANTOM CONNECTION */

async function connectPhantom() {

    const provider =
        getPhantom();

    if (!provider) {

        if (isMobile()) {

            walletStatus.textContent =
                "OPEN THIS SITE INSIDE PHANTOM";

            return;
        }

        walletStatus.textContent =
            "PHANTOM EXTENSION NOT FOUND";

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


        connectedWallet =
            response.publicKey.toString();


        walletStatus.textContent =
            "CONNECTED · " +
            shortenAddress(
                connectedWallet
            );


        walletButton.textContent =
            shortenAddress(
                connectedWallet
            );


        setTimeout(() => {

            walletOverlay.classList.remove(
                "active"
            );

        }, 800);


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

    if (!provider) {

        walletStatus.textContent =
            isMobile()
                ? "OPEN THIS SITE INSIDE SOLFLARE"
                : "SOLFLARE NOT FOUND";

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


        connectedWallet =
            response.publicKey.toString();


        walletStatus.textContent =
            "CONNECTED · " +
            shortenAddress(
                connectedWallet
            );


        walletButton.textContent =
            shortenAddress(
                connectedWallet
            );


        setTimeout(() => {

            walletOverlay.classList.remove(
                "active"
            );

        }, 800);


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

    if (!provider) {

        walletStatus.textContent =
            isMobile()
                ? "OPEN THIS SITE INSIDE BACKPACK"
                : "BACKPACK NOT FOUND";

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


        connectedWallet =
            response.publicKey.toString();


        walletStatus.textContent =
            "CONNECTED · " +
            shortenAddress(
                connectedWallet
            );


        walletButton.textContent =
            shortenAddress(
                connectedWallet
            );


        setTimeout(() => {

            walletOverlay.classList.remove(
                "active"
            );

        }, 800);


    } catch (error) {

        console.error(
            "Backpack connection error:",
            error
        );

        walletStatus.textContent =
            "CONNECTION CANCELLED";
    }
}


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

updateCounter();