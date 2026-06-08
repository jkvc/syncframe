'use client';

import { useState, useEffect } from 'react';
import type { ScreenPose } from '@syncframe/spatial/react';
import Pill from '@/components/editorial/Pill';
import StampShell from '@/components/ui/StampShell';
import { SPATIAL_API_BASE } from '@/lib/spatial-config';

interface PoseEditorProps {
  screenName: string;
  pose: ScreenPose;
  /** Matches map overlay stroke — used for embedded card accent. */
  accentColor?: string;
  /** Inline row inside a screen card — no outer shell or title. */
  embedded?: boolean;
}

export default function PoseEditor({
  screenName,
  pose,
  accentColor,
  embedded = false,
}: PoseEditorProps) {
  const [draft, setDraft] = useState(pose);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setDraft(pose);
  }, [pose, screenName]);

  const save = async () => {
    setPending(true);
    try {
      await fetch(`${SPATIAL_API_BASE}/screens/update-pose`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: screenName, pose: draft }),
      });
    } finally {
      setPending(false);
    }
  };

  const field = (key: keyof ScreenPose, label: string) => (
    <label className="flex min-w-[5.5rem] flex-1 flex-col gap-1">
      <span className="caption-mono text-ink-faint">{label}</span>
      <input
        type="number"
        className="rounded border-2 border-ink bg-paper px-2 py-1 font-mono text-sm"
        value={draft[key]}
        onChange={(e) =>
          setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))
        }
      />
    </label>
  );

  const fields = (
    <div className="flex flex-wrap items-end gap-3">
      {field('worldX', 'worldX')}
      {field('worldY', 'worldY')}
      {field('worldWidth', 'width')}
      {field('worldHeight', 'height')}
      <Pill onClick={() => void save()} disabled={pending} size="xs" active>
        Save pose
      </Pill>
    </div>
  );

  if (embedded) {
    return fields;
  }

  return (
    <StampShell variant="card" bleed={false}>
      <div className="space-y-3 p-4">
        <h3
          className="font-sans text-sm font-bold uppercase tracking-wide"
          style={accentColor ? { color: accentColor } : undefined}
        >
          Pose — {screenName}
        </h3>
        {fields}
      </div>
    </StampShell>
  );
}
