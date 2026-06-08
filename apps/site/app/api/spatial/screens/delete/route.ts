import { NextRequest } from 'next/server';
import { deleteScreen, isValidScreenName } from '@syncframe/spatial/server';
import { getSpatialServer } from '@/lib/spatial-server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name')?.trim() ?? '';
    if (!isValidScreenName(name)) {
      return Response.json({ error: 'Invalid screen name' }, { status: 400 });
    }

    const spatial = getSpatialServer();
    const meta = await spatial.getMeta();
    if (!meta.screens[name]) {
      return Response.json({ error: 'Screen not found' }, { status: 404 });
    }

    await spatial.apply((m) => deleteScreen(m, name));
    await spatial.publish();

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
