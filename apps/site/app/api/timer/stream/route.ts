import { getTimerSyncServer } from '@/lib/timer-server';
import { TIMER_CHANNEL_ID, defaultAnchor } from '@/lib/timer';

export const dynamic = 'force-dynamic';

// Server-Sent Events: stream the CoreSnapshot to the connected client.
// useAnchor / useScalarAnchor on the client consume this wire format directly.
export async function GET() {
  const server = getTimerSyncServer();

  await server.ensureAnchor(TIMER_CHANNEL_ID, () => defaultAnchor(Date.now()));

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      send(await server.buildSnapshot());

      unsubscribe = await server.subscribe((snapshot) => send(snapshot));

      heartbeat = setInterval(() => controller.enqueue(encoder.encode(': ping\n\n')), 30_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
