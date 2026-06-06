import { NextRequest } from 'next/server';
import { getSyncServer, ROOM_ID, CHANNEL_ID } from '@/lib/sync';
import { defaultAnchor, reduceTimer, isTimerAction, type TimerAnchor } from '@/lib/timer';

export const dynamic = 'force-dynamic';

// GET — current anchor, initializing the global channel on first access.
export async function GET() {
  try {
    const server = getSyncServer();
    let anchor = await server.getAnchor(ROOM_ID, CHANNEL_ID);
    if (!anchor) {
      anchor = defaultAnchor(Date.now());
      await server.setAnchor(ROOM_ID, CHANNEL_ID, anchor);
    }
    return Response.json(anchor);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST — apply an action, persist via the store, broadcast the snapshot.
export async function POST(request: NextRequest) {
  try {
    const { action } = (await request.json()) as { action?: unknown };
    if (!isTimerAction(action)) {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const server = getSyncServer();
    const now = Date.now();
    const current = ((await server.getAnchor(ROOM_ID, CHANNEL_ID)) as TimerAnchor | null) ?? defaultAnchor(now);
    const updated = reduceTimer(current, action, now);

    await server.setAnchor(ROOM_ID, CHANNEL_ID, updated);
    await server.publishUpdate(ROOM_ID);

    return Response.json(updated);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
