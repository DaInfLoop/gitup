import "./status_checker";

import { handleSSE } from "./streams/sse";
import { handleJSONStream } from "./streams/json";
import { handleRawStream } from "./streams/raw";
import { websocket } from "./streams/websocket";

const BASE_PATH = (process.env.BASE_URL ?? "")
    .replace(/\/+$/, "");

const addCORS = (response: Response) => {
    const headers = new Headers(response.headers);

    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Access-Control-Max-Age", "86400");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
};

Bun.serve({
    port: 3001,
    fetch(req, server) {
        if (req.method === "OPTIONS") {
            return addCORS(new Response(null, { status: 204 }))
        }

        const url = new URL(req.url, "https://localho.st/")

        if (
            BASE_PATH &&
            url.pathname !== BASE_PATH &&
            !url.pathname.startsWith(`${BASE_PATH}/`)
        ) {
            return addCORS(new Response("Not Found", { status: 404 }))
        }

        const path = (BASE_PATH
            ? url.pathname.slice(BASE_PATH.length)
            : url.pathname).replace(/\/+$/, "") || "/";

        if (path === "/")
            return addCORS(new Response(Bun.file('index.html')));

        if (path === "/status/auth") {
            return addCORS(Response.json({ success: true }))
        }

        if (path === "/status/sse") {
            server.timeout(req, 0)
            return addCORS(handleSSE(req));
        }

        if (path === "/status/json") {
            server.timeout(req, 0)
            return addCORS(handleJSONStream(req));
        }

        if (path === "/status/raw") {
            server.timeout(req, 0)
            return addCORS(handleRawStream(req));
        }

        if (path === "/status/ws") {
            if (server.upgrade(req, { data: {} })) { }
            else {
                return addCORS(new Response("Upgrade failed", {
                    status: 400,
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }));
            }
        }

        return addCORS(new Response("Not Found", {
            status: 404,
            headers: {
                'Content-Type': 'text/plain'
            }
        }))
    },
    websocket
})