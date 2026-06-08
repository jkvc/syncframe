'use client';

import { useEffect, useRef, useState } from 'react';
import type { ServerClock } from '@syncframe/core/react';
import { colorFromName } from '../color-from-name';
import type { ScreenPose, SpatialMeta } from '../types';

export interface CalibrationGridProps {
  pose: ScreenPose;
  screenName: string;
  spatial: Pick<SpatialMeta, 'worldBbox'>;
  clock: ServerClock;
}

const MINOR_STEP = 100;
const MAJOR_STEP = 500;

function useFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    const tick = (now: number) => {
      frames++;
      const elapsed = now - last;
      if (elapsed >= 500) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

export default function CalibrationGrid({
  pose,
  screenName,
  spatial,
  clock,
}: CalibrationGridProps) {
  const fps = useFps();
  const wrapRef = useRef<HTMLDivElement>(null);
  const { worldX, worldY, worldWidth, worldHeight } = pose;
  const { worldBbox } = spatial;

  const gridStartX = Math.floor(worldX / MINOR_STEP) * MINOR_STEP;
  const gridStartY = Math.floor(worldY / MINOR_STEP) * MINOR_STEP;
  const verticals: { x: number; major: boolean }[] = [];
  for (let x = gridStartX; x <= worldX + worldWidth; x += MINOR_STEP) {
    verticals.push({ x, major: x % MAJOR_STEP === 0 });
  }
  const horizontals: { y: number; major: boolean }[] = [];
  for (let y = gridStartY; y <= worldY + worldHeight; y += MINOR_STEP) {
    horizontals.push({ y, major: y % MAJOR_STEP === 0 });
  }

  const minSide = Math.min(worldWidth, worldHeight);
  const edgeThickness = Math.max(8, Math.round(minSide * 0.02));
  const crossArm = Math.max(20, Math.round(minSide * 0.04));
  const idColor = colorFromName(screenName);
  const clockReady = clock.sampleCount > 0;

  return (
    <div ref={wrapRef} className="fixed inset-0 bg-black text-white">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`${worldX} ${worldY} ${worldWidth} ${worldHeight}`}
        preserveAspectRatio="none"
      >
        {verticals.map((v) => (
          <line
            key={`v-${v.x}`}
            x1={v.x}
            x2={v.x}
            y1={worldY}
            y2={worldY + worldHeight}
            stroke={v.major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)'}
            strokeWidth={v.major ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {horizontals.map((h) => (
          <line
            key={`h-${h.y}`}
            x1={worldX}
            x2={worldX + worldWidth}
            y1={h.y}
            y2={h.y}
            stroke={h.major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.10)'}
            strokeWidth={h.major ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {worldX <= 0 && worldX + worldWidth >= 0 && worldY <= 0 && worldY + worldHeight >= 0 && (
          <g>
            <line x1={-crossArm} y1={0} x2={crossArm} y2={0} stroke="rgba(255,255,0,0.6)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={-crossArm} x2={0} y2={crossArm} stroke="rgba(255,255,0,0.6)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {verticals
          .filter((v) => v.major)
          .map((v) => (
            <text
              key={`vl-${v.x}`}
              x={v.x + 4}
              y={worldY + 16}
              fill="rgba(255,255,255,0.45)"
              fontSize={12}
              fontFamily="monospace"
            >
              x={v.x}
            </text>
          ))}
        {horizontals
          .filter((h) => h.major)
          .map((h) => (
            <text
              key={`hl-${h.y}`}
              x={worldX + 4}
              y={h.y - 4}
              fill="rgba(255,255,255,0.45)"
              fontSize={12}
              fontFamily="monospace"
            >
              y={h.y}
            </text>
          ))}

        <rect x={worldX} y={worldY} width={edgeThickness} height={worldHeight} fill="rgba(255,80,80,0.85)" />
        <rect x={worldX} y={worldY} width={worldWidth} height={edgeThickness} fill="rgba(80,220,120,0.85)" />
        <rect x={worldX + worldWidth - edgeThickness} y={worldY} width={edgeThickness} height={worldHeight} fill="rgba(80,140,255,0.85)" />
        <rect x={worldX} y={worldY + worldHeight - edgeThickness} width={worldWidth} height={edgeThickness} fill="rgba(245,205,70,0.85)" />

        {(
          [
            [worldX, worldY],
            [worldX + worldWidth, worldY],
            [worldX, worldY + worldHeight],
            [worldX + worldWidth, worldY + worldHeight],
          ] as const
        ).map(([cx, cy], i) => (
          <g key={`cross-${i}`}>
            <line x1={cx - crossArm} y1={cy} x2={cx + crossArm} y2={cy} stroke="white" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <line x1={cx} y1={cy - crossArm} x2={cx} y2={cy + crossArm} stroke="white" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
        ))}

        <text
          x={worldX + worldWidth / 2}
          y={worldY + worldHeight / 2}
          fill="rgba(255,255,255,0.85)"
          fontSize={Math.round(minSide * 0.12)}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {screenName}
        </text>
        <text
          x={worldX + worldWidth / 2}
          y={worldY + worldHeight / 2 + Math.round(minSide * 0.08)}
          fill="rgba(255,255,255,0.55)"
          fontSize={Math.round(minSide * 0.03)}
          fontFamily="monospace"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          world {worldWidth}×{worldHeight} of {worldBbox.width}×{worldBbox.height}
        </text>
      </svg>

      <div
        aria-hidden
        className="absolute left-0 right-0 top-0 h-3"
        style={{ background: idColor }}
      />

      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-white/75">
        pose: x={pose.worldX} y={pose.worldY} w={pose.worldWidth} h={pose.worldHeight}
      </div>

      <div className="absolute bottom-3 right-3 space-y-0.5 rounded bg-black/60 px-2 py-1 text-right font-mono text-[11px] text-white/75">
        <div>
          client {typeof window !== 'undefined' ? window.innerWidth : '?'}×
          {typeof window !== 'undefined' ? window.innerHeight : '?'} · dpr{' '}
          {typeof window !== 'undefined' ? window.devicePixelRatio.toFixed(1) : '?'}
        </div>
        <div>
          fps {fps} · rtt {clock.rttMs <= 0 ? '—' : `${Math.round(clock.rttMs)}ms`} · offset{' '}
          {clockReady ? `${Math.round(clock.offsetMs)}ms` : '—'} · samples {clock.sampleCount}
        </div>
      </div>
    </div>
  );
}
