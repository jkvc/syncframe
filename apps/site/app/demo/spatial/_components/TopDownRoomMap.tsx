'use client';

import type { ReactNode } from 'react';
import { colorFromName } from '@syncframe/spatial/react';
import type { SpatialMeta } from '@syncframe/spatial/react';
import { isScreenOnline } from '@syncframe/spatial/react';

interface TopDownRoomMapProps {
  spatial: SpatialMeta;
  selected: string | null;
  onSelect: (name: string) => void;
  /** Live world-content preview (e.g. bouncing dot), drawn behind screen outlines. */
  renderWorldContent?: () => ReactNode;
}

export default function TopDownRoomMap({
  spatial,
  selected,
  onSelect,
  renderWorldContent,
}: TopDownRoomMapProps) {
  const { worldBbox, screens } = spatial;
  const now = Date.now();
  const names = Object.keys(screens).sort();

  const scale = Math.min(480 / worldBbox.width, 280 / worldBbox.height, 1);

  return (
    <div className="overflow-hidden rounded border-2 border-ink bg-paper p-3">
      <svg
        width={worldBbox.width * scale}
        height={worldBbox.height * scale}
        viewBox={`0 0 ${worldBbox.width} ${worldBbox.height}`}
        className="mx-auto block"
      >
        <rect
          x={0}
          y={0}
          width={worldBbox.width}
          height={worldBbox.height}
          fill="var(--color-paper-muted, #f5f0e8)"
          stroke="var(--color-ink, #111)"
          strokeWidth={2}
        />
        {renderWorldContent?.()}
        {names.map((name) => {
          const entry = screens[name]!;
          const { pose } = entry;
          const online = isScreenOnline(entry, now);
          const color = colorFromName(name);
          const isSel = selected === name;
          return (
            <g key={name} onClick={() => onSelect(name)} className="cursor-pointer">
              <rect
                x={pose.worldX}
                y={pose.worldY}
                width={pose.worldWidth}
                height={pose.worldHeight}
                fill={color}
                fillOpacity={online ? 0.35 : 0.12}
                stroke={isSel ? '#111' : color}
                strokeWidth={isSel ? 4 : 2}
                strokeDasharray={online ? undefined : '8 4'}
              />
              <text
                x={pose.worldX + pose.worldWidth / 2}
                y={pose.worldY + pose.worldHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={24}
                fontFamily="ui-monospace, monospace"
                fill="#111"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
