import { NextRequest } from 'next/server';
import { getDotSpatialServer, getDotSyncServer } from '@/lib/dot-server';
import { DOT_CHANNEL_ID } from '@/lib/dot-config';
import {
  isDotAction,
  reduceDot,
  type DotAnchor,
} from '@/lib/dot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: unknown };
    if (!isDotAction(body.action)) {
      return Response.json({ error: 'action must be start, pause, or reset' }, { status: 400 });
    }

    const server = getDotSyncServer();
    const spatial = getDotSpatialServer();
    const meta = await spatial.getMeta();
    const { width: worldWidth, height: worldHeight } = meta.worldBbox;
    const now = Date.now();

    const existing = (await server.getAnchor(DOT_CHANNEL_ID)) as DotAnchor | null;

    const next = reduceDot(existing, body.action, worldWidth, worldHeight, now);

    if (body.action === 'reset' && existing) {
      await server.deleteAnchor(DOT_CHANNEL_ID);
    }
    await server.setAnchor(DOT_CHANNEL_ID, next);
    await spatial.publish();

    return Response.json({ ok: true, anchor: next });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
