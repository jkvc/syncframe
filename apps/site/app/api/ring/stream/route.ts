import { getRedis } from '@/lib/redis';
import { buildRingDemoSnapshot } from '@/lib/ring-snapshot';
import { getRingSpatialServer, getRingSyncServer } from '@/lib/ring-server';
import { RING_SPIN_CHANNEL } from '@/lib/ring-config';
import { buildInitialRingSpinAnchor } from '@/lib/ring';

export const dynamic = 'force-dynamic';

export async function GET() {
  const server = getRingSyncServer();
  const redis = getRedis();
  const spatial = getRingSpatialServer();

  await spatial.ensureInitialized();
  await server.ensureAnchor(RING_SPIN_CHANNEL, () => buildInitialRingSpinAnchor());

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        const snapshot = await buildRingDemoSnapshot(server, redis);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
      };

      controller.enqueue(encoder.encode(': open\n\n'));

      void send().then(() => {
        void server.subscribe(() => {
          void send();
        }).then((unsub) => {
          unsubscribe = unsub;
        });
      });

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
