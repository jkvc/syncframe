'use client';

import { useEffect, useMemo, useState } from 'react';
import { useServerClock, useAnchor } from '@syncframe/core/react';
import {
  useSpatialSnapshot,
  listScreenNames,
  isScreenOnline,
} from '@syncframe/spatial/react';
import Pill from '@/components/editorial/Pill';
import StampShell from '@/components/ui/StampShell';
import {
  SPATIAL_API_BASE,
  SPATIAL_STREAM_ENDPOINT,
  DOT_CHANNEL_ID,
} from '@/lib/spatial-config';
import type { DotAnchor } from '@/lib/dot';
import TopDownRoomMap from './TopDownRoomMap';
import DotMapPreview from './DotMapPreview';
import PoseEditor from './PoseEditor';

export function SpatialOperator() {
  const { spatial, connected } = useSpatialSnapshot({
    streamEndpoint: SPATIAL_STREAM_ENDPOINT,
  });
  const clock = useServerClock('/api/clock');
  const dotAnchor = useAnchor(DOT_CHANNEL_ID, SPATIAL_STREAM_ENDPOINT) as DotAnchor | null;
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const names = useMemo(
    () => (spatial ? listScreenNames(spatial) : []),
    [spatial],
  );

  useEffect(() => {
    if (!selected && names[0]) setSelected(names[0]);
  }, [names, selected]);

  const dotRunning =
    !!dotAnchor &&
    (dotAnchor.motion.vxUnitsPerMs !== 0 || dotAnchor.motion.vyUnitsPerMs !== 0);

  if (!spatial) {
    return (
      <p className="caption-mono text-ink-faint">
        Connecting{connected ? '' : ' (offline)'}…
      </p>
    );
  }

  const selectedEntry = selected ? spatial.screens[selected] : null;

  const dotAction = (action: 'start' | 'pause' | 'reset') =>
    fetch(`${SPATIAL_API_BASE}/dot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

  const setRenderMode = (mode: 'calibration' | 'content') =>
    fetch(`${SPATIAL_API_BASE}/render-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });

  const registerScreen = async () => {
    const name = newName.trim();
    if (!name) return;
    await fetch(`${SPATIAL_API_BASE}/screens/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setNewName('');
    setSelected(name);
  };

  const deleteScreen = async (name: string) => {
    await fetch(`${SPATIAL_API_BASE}/screens/delete?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    if (selected === name) setSelected(null);
  };

  const identify = (name: string) =>
    fetch(`${SPATIAL_API_BASE}/identify`, {
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
          {dotRunning ? (
            <Pill size="xs" onClick={() => void dotAction('pause')}>
              Pause dot
            </Pill>
          ) : (
            <Pill size="xs" active onClick={() => void dotAction('start')}>
              {dotAnchor ? 'Resume dot' : 'Start dot'}
            </Pill>
          )}
          <Pill size="xs" onClick={() => void dotAction('reset')}>
            Reset dot
          </Pill>
          <span className="caption-mono ml-auto text-ink-faint">
            {connected ? 'SSE connected' : 'SSE offline'}
          </span>
        </div>
      </StampShell>

      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border-2 border-ink bg-paper px-3 py-1 font-mono text-sm"
          placeholder="screen name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Pill size="xs" active onClick={() => void registerScreen()}>
          Register screen
        </Pill>
      </div>

      <TopDownRoomMap
        spatial={spatial}
        selected={selected}
        onSelect={setSelected}
        renderWorldContent={() => (
          <DotMapPreview anchor={dotAnchor} clock={clock} />
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {names.map((name) => {
          const entry = spatial.screens[name]!;
          const online = isScreenOnline(entry, Date.now());
          return (
            <StampShell key={name} variant="card" bleed={false}>
              <div className="flex items-center justify-between gap-2 p-3">
                <div>
                  <div className="font-mono text-sm font-bold text-ink">{name}</div>
                  <div className="caption-mono text-ink-faint">
                    {online ? 'online' : 'offline'} · {Object.keys(entry.sessions).length} session(s)
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Pill size="xs" onClick={() => setSelected(name)}>
                    Select
                  </Pill>
                  <Pill size="xs" onClick={() => void identify(name)} disabled={!online}>
                    Identify
                  </Pill>
                  <Pill size="xs" onClick={() => void deleteScreen(name)}>
                    Delete
                  </Pill>
                  <Pill
                    size="xs"
                    href={`/demo/spatial/display?screenName=${encodeURIComponent(name)}`}
                  >
                    Open display ↗
                  </Pill>
                </div>
              </div>
            </StampShell>
          );
        })}
      </div>

      {selectedEntry && (
        <PoseEditor screenName={selected!} pose={selectedEntry.pose} />
      )}
    </div>
  );
}
