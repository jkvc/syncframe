import { NextRequest } from 'next/server';
import { setRenderMode } from '@syncframe/spatial/server';
import { getDotSpatialServer } from '@/lib/dot-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { mode?: string };
    if (body.mode !== 'calibration' && body.mode !== 'content') {
      return Response.json({ error: 'mode must be calibration or content' }, { status: 400 });
    }

    const spatial = getDotSpatialServer();
    const meta = await spatial.apply((m) => setRenderMode(m, body.mode as 'calibration' | 'content'));
    await spatial.publish();

    return Response.json({ ok: true, renderMode: meta.renderMode });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
