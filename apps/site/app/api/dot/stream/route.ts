import { getRedis } from '@/lib/redis';
import { buildDotDemoSnapshot } from '@/lib/dot-snapshot';
import { getDotSpatialServer, getDotSyncServer } from '@/lib/dot-server';
import { DOT_CHANNEL_ID } from '@/lib/dot-config';
import { buildInitialDotAnchor } from '@/lib/dot';

export const dynamic = 'force-dynamic';

export async function GET() {
  const server = getDotSyncServer();
  const redis = getRedis();
  const spatial = getDotSpatialServer();

  await spatial.ensureInitialized();
  await server.ensureAnchor(DOT_CHANNEL_ID, () => buildInitialDotAnchor());

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        const snapshot = await buildDotDemoSnapshot(server, redis);
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
