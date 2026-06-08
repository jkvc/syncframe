'use client';

import type { ComponentType } from 'react';
import type { CoreSnapshot } from '@syncframe/core/server';
import type { ServerClock } from '@syncframe/core/react';
import { colorFromName } from '../color-from-name';
import { isScreenOnline, listScreenNames } from '../reducers';
import type { ScreenEntry, SpatialMeta } from '../types';
import type { WorldPreviewContext } from './content-layer';

export interface TopDownRoomMapProps {
  spatial: SpatialMeta;
  snapshot: CoreSnapshot;
  clock: ServerClock;
  /** Consumer-owned world renderer (SVG, canvas, …) at native world scale. */
  MapView: ComponentType<WorldPreviewContext>;
  selectedScreenName: string | null;
  onScreenSelect?: (name: string) => void;
}

export default function TopDownRoomMap({
  spatial,
  snapshot,
  clock,
  MapView,
  selectedScreenName,
  onScreenSelect,
}: TopDownRoomMapProps) {
  const { worldBbox, screens } = spatial;
  const worldWidth = worldBbox.width;
  const worldHeight = worldBbox.height;
  const now = Date.now();
  const names = listScreenNames(spatial);

  const previewCtx: WorldPreviewContext = {
    snapshot,
    clock,
    spatial,
    worldWidth,
    worldHeight,
  };

  return (
    <div className="inline-block w-full max-w-3xl rounded bg-black">
      <svg
        viewBox={`0 0 ${worldWidth} ${worldHeight}`}
        className="block h-auto w-full"
        style={{ aspectRatio: `${worldWidth} / ${worldHeight}` }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Top-down map of world ${worldWidth} by ${worldHeight}`}
      >
        <rect
          x={0}
          y={0}
          width={worldWidth}
          height={worldHeight}
          fill="#000"
        />
        <rect
          x={0}
          y={0}
          width={worldWidth}
          height={worldHeight}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        <MapView {...previewCtx} />

        {names.map((name) => (
          <ScreenRect
            key={name}
            name={name}
            entry={screens[name]!}
            selected={name === selectedScreenName}
            online={isScreenOnline(screens[name]!, now)}
            worldWidth={worldWidth}
            onSelect={onScreenSelect}
          />
        ))}

        <text
          x={8}
          y={24}
          fill="rgba(255,255,255,0.45)"
          fontSize={Math.max(10, worldWidth * 0.012)}
          fontFamily="monospace"
        >
          world {worldWidth}×{worldHeight}
        </text>
      </svg>
    </div>
  );
}

function ScreenRect({
  name,
  entry,
  selected,
  online,
  worldWidth,
  onSelect,
}: {
  name: string;
  entry: ScreenEntry;
  selected: boolean;
  online: boolean;
  worldWidth: number;
  onSelect?: (name: string) => void;
}) {
  const { pose } = entry;
  const idColor = colorFromName(name);
  const opacity = online ? 0.9 : 0.4;
  const stroke = selected ? 'white' : idColor;
  const strokeWidth = selected ? 4 : 2;
  const fontSize = Math.max(12, worldWidth * 0.014);

  return (
    <g
      opacity={opacity}
      onClick={onSelect ? () => onSelect(name) : undefined}
      className={onSelect ? 'cursor-pointer' : undefined}
      pointerEvents="all"
    >
      <rect
        x={pose.worldX}
        y={pose.worldY}
        width={pose.worldWidth}
        height={pose.worldHeight}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={selected ? undefined : '2 6'}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={pose.worldX + 6}
        y={pose.worldY + fontSize + 4}
        fill="white"
        fontSize={fontSize}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight={600}
        pointerEvents="none"
      >
        {name}
      </text>
      <text
        x={pose.worldX + 6}
        y={pose.worldY + fontSize * 2 + 6}
        fill="rgba(255,255,255,0.7)"
        fontSize={fontSize * 0.7}
        fontFamily="monospace"
        pointerEvents="none"
      >
        {pose.worldWidth}×{pose.worldHeight} @ ({pose.worldX},{pose.worldY})
      </text>
    </g>
  );
}
