import pubsub from "../pubsub";

const encoder = new TextEncoder();

export function handleRawStream(request: Request): Response {
    let closed = false;

    let cleanup = () => {};

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            function send(data: string) {
                if (closed) return;

                try {
                    controller.enqueue(
                        encoder.encode(
                            `${data}\n`
                        )
                    );
                } catch {
                    cleanup();
                }
            }

            function publishHandler(up: boolean) {
                send(up ? "GitHub is operational" : "GitHub is experiencing issues");
            }

            cleanup = () => {
                if (closed) return;
                closed = true;

                pubsub.off("publish", publishHandler);
                request.signal.removeEventListener("abort", cleanup);
            };

            pubsub.on("publish", publishHandler);

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
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no"
        }
    });
}