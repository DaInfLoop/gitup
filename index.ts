const BASE_PATH = (process.env.BASE_URL ?? "")
    .replace(/\/+$/, "");

const addCORS = (response: Response) => 
    new Response(response.body, {
        status: response.status,
        headers: {
            ...response.headers,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400"
        }
    });

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

        return addCORS(new Response("Not Found", { status: 404 }))
    },
    websocket: {
        open(ws) {
            
        },

        message(ws, message) {
            
        },

        close(ws, code, reason) {
            
        },
    }
})