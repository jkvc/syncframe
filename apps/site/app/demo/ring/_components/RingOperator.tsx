'use client';

import { useMemo } from 'react';
import { useAnchor, useServerClock } from '@syncframe/core/react';
import {
  useSpatialSnapshot,
  listScreenNames,
  isScreenOnline,
  colorFromName,
} from '@syncframe/spatial/react';
import { TopDownRoomMap } from '@syncframe/spatial/ui';
import Pill from '@/components/editorial/Pill';
import StampShell from '@/components/ui/StampShell';
import { RING_API_BASE, RING_SPIN_CHANNEL, RING_STREAM_ENDPOINT } from '@/lib/ring-config';
import { isRingSpinning, type RingSpinAnchor } from '@/lib/ring';
import { useRingContentLayer } from '@/lib/ring-layer';

export function RingOperator() {
  const { spatial, snapshot, connected } = useSpatialSnapshot({
    streamEndpoint: RING_STREAM_ENDPOINT,
  });
  const clock = useServerClock('/api/clock');
  const spinAnchor = useAnchor(RING_SPIN_CHANNEL, RING_STREAM_ENDPOINT) as RingSpinAnchor | null;
  const contentLayer = useRingContentLayer();
  const spinning = isRingSpinning(spinAnchor);

  const names = useMemo(
    () => (spatial ? listScreenNames(spatial) : []),
    [spatial],
  );

  if (!spatial || !snapshot) {
    return (
      <p className="caption-mono text-ink-faint">
        Connecting{connected ? '' : ' (offline)'}…
      </p>
    );
  }

  const spinAction = (action: 'start' | 'pause') =>
    fetch(`${RING_API_BASE}/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, serverNow: clock.serverNow() }),
    });

  const setRenderMode = (mode: 'calibration' | 'content') =>
    fetch(`${RING_API_BASE}/render-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });

  const identify = (name: string) =>
    fetch(`${RING_API_BASE}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

  return (
    <div className="space-y-6">
      <StampShell variant="card" bleed={false}>
        <div className="flex flex-wrap items-center gap-2 p-4">
          <Pill
            size="xs"
            active={spatial.renderMode === 'calibration'}
            onClick={() => void setRenderMode('calibration')}
          >
            Calibration
          </Pill>
          <Pill
            size="xs"
            active={spatial.renderMode === 'content'}
            onClick={() => void setRenderMode('content')}
          >
            Content
          </Pill>
          <span className="mx-1 text-ink-faint">|</span>
          {spinning ? (
            <Pill size="xs" onClick={() => void spinAction('pause')}>
              Pause ring
            </Pill>
          ) : (
            <Pill size="xs" active onClick={() => void spinAction('start')}>
              Start ring
            </Pill>
          )}
          <span className="caption-mono ml-auto text-ink-faint">
            {connected ? 'SSE connected' : 'SSE offline'} · 500×500 world ·{' '}
            {contentLayer.id}
          </span>
        </div>
      </StampShell>

      <StampShell variant="card" bleed={false} className="p-3">
        <TopDownRoomMap
          spatial={spatial}
          snapshot={snapshot}
          clock={clock}
          MapView={contentLayer.MapView}
          selectedScreenName={null}
        />
      </StampShell>

      <div className="space-y-3">
        {names.map((name) => {
          const entry = spatial.screens[name]!;
          const online = isScreenOnline(entry, Date.now());
          const accent = colorFromName(name);
          const { pose } = entry;
          return (
            <StampShell key={name} variant="card" bleed={false}>
              <div
                className="space-y-3 p-4"
                style={{
                  borderLeft: `4px solid ${accent}`,
                  background: `color-mix(in srgb, ${accent} 8%, var(--color-surface))`,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="font-mono text-base font-bold"
                      style={{ color: accent }}
                    >
                      {name}
                    </div>
                    <div className="caption-mono text-ink-faint">
                      {online ? 'online' : 'offline'} ·{' '}
                      {Object.keys(entry.sessions).length} session(s) · pose{' '}
                      {pose.worldWidth}×{pose.worldHeight} @ ({pose.worldX},{' '}
                      {pose.worldY})
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Pill
                      size="xs"
                      onClick={() => void identify(name)}
                      disabled={!online}
                    >
                      Identify
                    </Pill>
                    <Pill
                      size="xs"
                      href={`/demo/ring/display?screenName=${encodeURIComponent(name)}`}
                    >
                      Open display ↗
                    </Pill>
                  </div>
                </div>
              </div>
            </StampShell>
          );
        })}
      </div>
    </div>
  );
}
