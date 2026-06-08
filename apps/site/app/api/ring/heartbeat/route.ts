import { NextRequest } from 'next/server';
import { heartbeat } from '@syncframe/spatial/server';
import { getRingSpatialServer } from '@/lib/ring-server';
import { isValidScreenName } from '@syncframe/spatial/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      screenName?: string;
      sessionId?: string;
      clientWidthPx?: number;
      clientHeightPx?: number;
      devicePixelRatio?: number;
      userAgent?: string;
    };

    const screenName = body.screenName?.trim() ?? '';
    const sessionId = body.sessionId?.trim() ?? '';

    if (!isValidScreenName(screenName) || !sessionId) {
      return Response.json({ error: 'Invalid screenName or sessionId' }, { status: 400 });
    }

    const spatial = getRingSpatialServer();
    const now = new Date().toISOString();
    const session = {
      sessionId,
      clientWidthPx: Number(body.clientWidthPx) || 0,
      clientHeightPx: Number(body.clientHeightPx) || 0,
      devicePixelRatio: Number(body.devicePixelRatio) || 1,
      userAgent: typeof body.userAgent === 'string' ? body.userAgent : '',
      lastSeenAt: now,
    };

    const current = await spatial.getMeta();
    if (!current.screens[screenName]) {
      return Response.json({ error: 'Screen not found' }, { status: 404 });
    }

    await spatial.apply((meta) => {
      const result = heartbeat(meta, screenName, session);
      return result === 'deleted' ? meta : result;
    });

    await spatial.publish();
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
