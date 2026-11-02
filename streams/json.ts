import pubsub from "../pubsub";

const encoder = new TextEncoder();

export function handleJSONStream(request: Request): Response {
    let closed = false;
    let keepalive: ReturnType<typeof setInterval>;

    let cleanup = () => {};

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            function send(data: unknown) {
                if (closed) return;

                try {
                    controller.enqueue(
                        encoder.encode(
                            `${JSON.stringify(data)}\n`
                        )
                    );
                } catch {
                    cleanup();
                }
            }

            function publishHandler(up: boolean) {
                send({
                    id: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
                    time: Math.floor(Date.now() / 1000),
                    event: "message",
                    topic: "events",
                    message: up ? "GitHub is operational" : "GitHub is experiencing issues",
                    title: "GitHub status",
                    tags: up ? ["white_check_mark"] : ["warning"]
                });
            }

            cleanup = () => {
                if (closed) return;
                closed = true;

                clearInterval(keepalive);
                pubsub.off("publish", publishHandler);
                request.signal.removeEventListener("abort", cleanup);
            };

            pubsub.on("publish", publishHandler);

            send({
                id: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
                time: Math.floor(Date.now() / 1000),
                event: "open",
                topic: "events"
            });

            keepalive = setInterval(() => {
                send({
                    id: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
                    time: Math.floor(Date.now() / 1000),
                    event: "keepalive",
                    topic: "events"
                });
            }, 25_000);

            request.signal.addEventListener("abort", cleanup, {
                once: true
            });

            if (request.signal.aborted) cleanup();
        },

        cancel() {
            cleanup();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no"
        }
    });
}