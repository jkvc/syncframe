import { NextRequest } from 'next/server';
import { getTimerSyncServer } from '@/lib/timer-server';
import {
  TIMER_CHANNEL_ID,
  defaultAnchor,
  reduceTimer,
  isTimerAction,
  type TimerAnchor,
} from '@/lib/timer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const server = getTimerSyncServer();
    const anchor = await server.ensureAnchor(TIMER_CHANNEL_ID, () => defaultAnchor(Date.now()));
    return Response.json(anchor);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = (await request.json()) as { action?: unknown };
    if (!isTimerAction(action)) {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    const server = getTimerSyncServer();
    const now = Date.now();
    const current =
      ((await server.getAnchor(TIMER_CHANNEL_ID)) as TimerAnchor | null) ?? defaultAnchor(now);
    const updated = reduceTimer(current, action, now);

    await server.setAnchor(TIMER_CHANNEL_ID, updated);
    await server.publishUpdate();

    return Response.json(updated);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
