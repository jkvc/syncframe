import { NextRequest } from 'next/server';
import { getRedis } from '@/lib/redis';
import { setDotIdentifyTrigger } from '@/lib/dot-identify';
import { getDotSpatialServer } from '@/lib/dot-server';
import { isValidScreenName } from '@syncframe/spatial/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? '';
    if (!isValidScreenName(name)) {
      return Response.json({ error: 'Invalid screen name' }, { status: 400 });
    }

    const spatial = getDotSpatialServer();
    const meta = await spatial.getMeta();
    if (!meta.screens[name]) {
      return Response.json({ error: 'Screen not found' }, { status: 404 });
    }

    const redis = getRedis();
    const trigger = await setDotIdentifyTrigger(redis, name);
    await spatial.publish();

    return Response.json({ ok: true, trigger });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
