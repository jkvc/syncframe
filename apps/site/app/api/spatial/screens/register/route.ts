import { NextRequest } from 'next/server';
import { isValidScreenName } from '@syncframe/spatial/server';
import { getSpatialServer } from '@/lib/spatial-server';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? '';
    if (!isValidScreenName(name)) {
      return Response.json({ error: 'Invalid screen name' }, { status: 400 });
    }

    const spatial = getSpatialServer();
    const result = await spatial.registerScreen(name);
    if (!result.ok) {
      return Response.json(
        { error: `Screen limit reached (max ${spatial.maxScreens})` },
        { status: 409 },
      );
    }
    await spatial.publish();

    return Response.json({ ok: true, screen: result.meta.screens[name] });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
