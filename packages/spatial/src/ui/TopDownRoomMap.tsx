'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { ServerClock } from '@syncframe/core/react';
import { colorFromName } from '../color-from-name';
import { isScreenOnline, listScreenNames } from '../reducers';
import type { ScreenEntry, SpatialMeta } from '../types';
import type { WorldPreviewContext } from './content-layer';

export type { WorldPreviewContext };

export interface TopDownRoomMapProps {
  spatial: SpatialMeta;
  selectedScreenName: string | null;
  clock: ServerClock;
  onScreenSelect?: (name: string) => void;
  renderWorldContent?: (ctx: WorldPreviewContext) => ReactNode;
  /** When set, builds WorldPreviewContext from spatial + snapshot passed here. */
  snapshot?: WorldPreviewContext['snapshot'];
}

export default function TopDownRoomMap({
  spatial,
  selectedScreenName,
  clock,
  onScreenSelect,
  renderWorldContent,
  snapshot,
}: TopDownRoomMapProps) {
  const { worldBbox, screens } = spatial;
  const worldWidth = worldBbox.width;
  const worldHeight = worldBbox.height;
  const now = Date.now();
  const names = listScreenNames(spatial);

  const screenBoundsXs = names.flatMap((name) => {
    const p = screens[name]!.pose;
    return [p.worldX, p.worldX + p.worldWidth];
  });
  const screenBoundsYs = names.flatMap((name) => {
    const p = screens[name]!.pose;
    return [p.worldY, p.worldY + p.worldHeight];
  });
  const minX = Math.min(0, ...screenBoundsXs);
  const maxX = Math.max(worldWidth, ...screenBoundsXs);
  const minY = Math.min(0, ...screenBoundsYs);
  const maxY = Math.max(worldHeight, ...screenBoundsYs);
  const padX = (maxX - minX) * 0.05;
  const padY = (maxY - minY) * 0.05;
  const vbX = minX - padX;
  const vbY = minY - padY;
  const vbW = maxX - minX + padX * 2;
  const vbH = maxY - minY + padY * 2;

  const wrapRef = useRef<HTMLDivElement>(null);
  const previewCtx: WorldPreviewContext | null =
    renderWorldContent && snapshot
      ? { snapshot, clock, spatial, worldWidth, worldHeight }
      : null;

  return (
    <div ref={wrapRef} className="h-full w-full overflow-hidden rounded bg-[#0a0a0a]">
      <svg
        className="h-full w-full"
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
      >
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

        {previewCtx && (
          <>
            <clipPath id="spatial-world-clip">
              <rect x={0} y={0} width={worldWidth} height={worldHeight} />
            </clipPath>
            <g clipPath="url(#spatial-world-clip)">
              {renderWorldContent!(previewCtx)}
            </g>
          </>
        )}

        <text
          x={4}
          y={vbY + vbH * 0.04}
          fill="rgba(255,255,255,0.45)"
          fontSize={Math.max(10, vbW * 0.012)}
          fontFamily="monospace"
        >
          world {worldWidth}×{worldHeight}
        </text>

        {names.map((name) => (
          <ScreenRect
            key={name}
            name={name}
            entry={screens[name]!}
            selected={name === selectedScreenName}
            online={isScreenOnline(screens[name]!, now)}
            vbW={vbW}
            onSelect={onScreenSelect}
          />
        ))}
      </svg>
    </div>
  );
}

function ScreenRect({
  name,
  entry,
  selected,
  online,
  vbW,
  onSelect,
}: {
  name: string;
  entry: ScreenEntry;
  selected: boolean;
  online: boolean;
  vbW: number;
  onSelect?: (name: string) => void;
}) {
  const { pose } = entry;
  const idColor = colorFromName(name);
  const opacity = online ? 0.9 : 0.4;
  const stroke = selected ? 'white' : idColor;
  const strokeWidth = selected ? 4 : 2;
  const fontSize = Math.max(12, vbW * 0.014);

  return (
    <g
      opacity={opacity}
      onClick={onSelect ? () => onSelect(name) : undefined}
      className={onSelect ? 'cursor-pointer' : undefined}
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
      >
        {name}
      </text>
      <text
        x={pose.worldX + 6}
        y={pose.worldY + fontSize * 2 + 6}
        fill="rgba(255,255,255,0.7)"
        fontSize={fontSize * 0.7}
        fontFamily="monospace"
      >
        {pose.worldWidth}×{pose.worldHeight} @ ({pose.worldX},{pose.worldY})
      </text>
    </g>
  );
}
