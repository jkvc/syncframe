import { NextRequest } from 'next/server';
import {
  isValidScreenName,
  normalizeScreenPose,
  updatePose,
} from '@syncframe/spatial/server';
import { getDotSpatialServer } from '@/lib/dot-server';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string; pose?: unknown };
    const name = body.name?.trim() ?? '';
    const pose = normalizeScreenPose(body.pose);
    if (!isValidScreenName(name)) {
      return Response.json({ error: 'Invalid screen name' }, { status: 400 });
    }
    if (!pose) {
      return Response.json(
        { error: 'pose must include numeric worldX/Y/W/H (W,H > 0)' },
        { status: 400 },
      );
    }

    const spatial = getDotSpatialServer();
    const current = await spatial.getMeta();
    if (!current.screens[name]) {
      return Response.json({ error: 'Screen not found' }, { status: 404 });
    }

    const next = await spatial.apply((m) => updatePose(m, name, pose) ?? m);
    await spatial.publish();

    return Response.json({ ok: true, screen: next.screens[name] });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
