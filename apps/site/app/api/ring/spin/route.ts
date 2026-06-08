import { NextRequest } from 'next/server';
import { RING_SPIN_CHANNEL } from '@/lib/ring-config';
import {
  isRingSpinAction,
  reduceRingSpin,
  type RingSpinAnchor,
} from '@/lib/ring';
import { getRingSpatialServer, getRingSyncServer } from '@/lib/ring-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: unknown; serverNow?: unknown };
    if (!isRingSpinAction(body.action)) {
      return Response.json({ error: 'action must be start or pause' }, { status: 400 });
    }

    const server = getRingSyncServer();
    const spatial = getRingSpatialServer();
    const now =
      typeof body.serverNow === 'number' && Number.isFinite(body.serverNow)
        ? body.serverNow
        : Date.now();

    const existing = (await server.getAnchor(RING_SPIN_CHANNEL)) as RingSpinAnchor | null;
    const next = reduceRingSpin(existing, body.action, now);

    await server.setAnchor(RING_SPIN_CHANNEL, next);
    await spatial.publish();

    return Response.json({ ok: true, anchor: next });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
