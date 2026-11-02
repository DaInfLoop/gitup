import type { WebSocketHandler } from "bun";
import pubsub from "../pubsub";

export const websocket: WebSocketHandler<{
    publishHandler?: (up: boolean) => any;
}> = {
    data: {},

    open(ws) {
        ws.send(JSON.stringify({
            id: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
            time: Math.floor(Date.now() / 1000),
            event: "open",
            topic: "events"
        }))

        ws.data.publishHandler = function (up) {
            ws.send(JSON.stringify({
                id: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
                time: Math.floor(Date.now() / 1000),
                event: "message",
                topic: "events",
                message: up ? "GitHub is operational" : "GitHub is experiencing issues",
                title: "GitHub status",
                tags: up ? ["white_check_mark"] : ["warning"]
            }))
        }

        pubsub.on('publish', ws.data.publishHandler);
    },

    message(ws, message) {

    },

    close(ws, code, reason) {
        if (ws.data.publishHandler) pubsub.off('publish', ws.data.publishHandler)
    },
};

