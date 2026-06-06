import { NextRequest } from 'next/server';
import { getSyncServer, ROOM_ID, CHANNEL_ID } from '@/lib/sync';
import { defaultAnchor } from '@/lib/timer';

export const dynamic = 'force-dynamic';

// Server-Sent Events: stream the room's CoreSnapshot to the connected client.
// useAnchor / useScalarAnchor on the client consume this wire format directly.
export async function GET(request: NextRequest) {
  const roomId = new URL(request.url).searchParams.get('roomId') ?? ROOM_ID;
  const server = getSyncServer();

  // Cold start: make sure the global channel exists so the first viewer sees
  // the default countdown rather than an empty snapshot.
  if (!(await server.getAnchor(roomId, CHANNEL_ID))) {
    await server.setAnchor(roomId, CHANNEL_ID, defaultAnchor(Date.now()));
  }

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      // Push the current snapshot immediately so a fresh client syncs at once.
      send(await server.buildSnapshot(roomId));

      unsubscribe = await server.subscribe(roomId, (snapshot) => send(snapshot));

      // Heartbeat comment keeps intermediaries from closing an idle stream.
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
