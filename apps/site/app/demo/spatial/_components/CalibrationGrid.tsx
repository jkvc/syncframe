'use client';

import type { ServerClock } from '@syncframe/core/react';
import { colorFromName } from '@syncframe/spatial/react';
import type { ScreenPose, WorldBbox } from '@syncframe/spatial/react';

interface CalibrationGridProps {
  pose: ScreenPose;
  screenName: string;
  worldBbox: WorldBbox;
  clock: ServerClock;
}

const MINOR = 100;
const MAJOR = 500;

export default function CalibrationGrid({
  pose,
  screenName,
  worldBbox,
  clock,
}: CalibrationGridProps) {
  const { worldX, worldY, worldWidth, worldHeight } = pose;
  const bandColor = colorFromName(screenName);

  const gridStartX = Math.floor(worldX / MINOR) * MINOR;
  const gridStartY = Math.floor(worldY / MINOR) * MINOR;

  const verticals: { x: number; major: boolean }[] = [];
  for (let x = gridStartX; x <= worldX + worldWidth; x += MINOR) {
    if (x >= worldX - 1 && x <= worldX + worldWidth + 1) {
      verticals.push({ x, major: x % MAJOR === 0 });
    }
  }
  const horizontals: { y: number; major: boolean }[] = [];
  for (let y = gridStartY; y <= worldY + worldHeight; y += MINOR) {
    if (y >= worldY - 1 && y <= worldY + worldHeight + 1) {
      horizontals.push({ y, major: y % MAJOR === 0 });
    }
  }

  const minSide = Math.min(worldWidth, worldHeight);
  const edgeThickness = Math.max(8, Math.round(minSide * 0.02));

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white">
      <div
        className="absolute left-0 right-0 top-0 h-3"
        style={{ backgroundColor: bandColor }}
        aria-hidden
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`${worldX} ${worldY} ${worldWidth} ${worldHeight}`}
        preserveAspectRatio="none"
      >
        {verticals.map(({ x, major }) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1={worldY}
            x2={x}
            y2={worldY + worldHeight}
            stroke={major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={major ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {horizontals.map(({ y, major }) => (
          <line
            key={`h-${y}`}
            x1={worldX}
            y1={y}
            x2={worldX + worldWidth}
            y2={y}
            stroke={major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
            strokeWidth={major ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line x1={worldX} y1={worldY} x2={worldX} y2={worldY + worldHeight} stroke="#ff4444" strokeWidth={edgeThickness} vectorEffect="non-scaling-stroke" />
        <line x1={worldX} y1={worldY} x2={worldX + worldWidth} y2={worldY} stroke="#44ff44" strokeWidth={edgeThickness} vectorEffect="non-scaling-stroke" />
        <line
          x1={worldX + worldWidth}
          y1={worldY}
          x2={worldX + worldWidth}
          y2={worldY + worldHeight}
          stroke="#4488ff"
          strokeWidth={edgeThickness}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={worldX}
          y1={worldY + worldHeight}
          x2={worldX + worldWidth}
          y2={worldY + worldHeight}
          stroke="#ffcc00"
          strokeWidth={edgeThickness}
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={worldX + worldWidth / 2}
          y={worldY + worldHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={Math.min(worldWidth, worldHeight) * 0.08}
          fontFamily="ui-monospace, monospace"
          opacity={0.9}
        >
          {screenName}
        </text>
      </svg>
      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-white/75">
        pose: x={pose.worldX} y={pose.worldY} w={pose.worldWidth} h={pose.worldHeight}
      </div>
      <div className="absolute bottom-3 right-3 space-y-0.5 rounded bg-black/60 px-2 py-1 text-right font-mono text-[11px] text-white/75">
        <div>
          client {typeof window !== 'undefined' ? window.innerWidth : '?'}×
          {typeof window !== 'undefined' ? window.innerHeight : '?'}
        </div>
        <div>
          world {worldBbox.width}×{worldBbox.height} · offset{' '}
          {clock.sampleCount > 0 ? `${Math.round(clock.offsetMs)}ms` : '—'}
        </div>
      </div>
    </div>
  );
}
