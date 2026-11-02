import pubsub from "./pubsub";

let lastStatus: boolean | null = null;

async function checkStatus() {
    try {
        const response = await fetch("https://www.githubstatus.com/api/v2/status.json");

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = await response.json() as {
            status: {
                indicator: string;
                description: string;
            }
        };

        const up = data.status.indicator === "none";

        if (lastStatus !== up) {
            lastStatus = up;

            console.log(
                `[GitHub] ${up ? "Operational" : "Issues detected"}`
            );

            pubsub.emit("publish", up);
        }
    } catch (error) {
        console.error("[GitHub] Status check failed:", error);
    }
}

checkStatus();
setInterval(checkStatus, 30_000);