'use client';

import { useState, useEffect } from 'react';
import type { ScreenPose } from '@syncframe/spatial/react';
import Pill from '@/components/editorial/Pill';
import StampShell from '@/components/ui/StampShell';
import { SPATIAL_API_BASE } from '@/lib/spatial-config';

interface PoseEditorProps {
  screenName: string;
  pose: ScreenPose;
}

export default function PoseEditor({ screenName, pose }: PoseEditorProps) {
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
    <label className="flex flex-col gap-1">
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

  return (
    <StampShell variant="card" bleed={false}>
      <div className="space-y-3 p-4">
        <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-ink">
          Pose — {screenName}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {field('worldX', 'worldX')}
          {field('worldY', 'worldY')}
          {field('worldWidth', 'width')}
          {field('worldHeight', 'height')}
        </div>
        <Pill onClick={() => void save()} disabled={pending} size="xs" active>
          Save pose
        </Pill>
      </div>
    </StampShell>
  );
}
