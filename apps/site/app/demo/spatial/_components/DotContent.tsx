'use client';

import { useEffect, useRef } from 'react';
import type { ServerClock } from '@syncframe/core/react';
import { useAnchor } from '@syncframe/core/react';
import type { ScreenPose } from '@syncframe/spatial/react';
import {
  DOT_CHANNEL_ID,
  evaluateLinear2dBouncing,
  mapDotToScreenPixels,
  type DotAnchor,
} from '@/lib/dot';
import { SPATIAL_STREAM_ENDPOINT } from '@/lib/spatial-config';

const DOT_COLORS = [
  '#ff5277',
  '#ffb52e',
  '#33d27e',
  '#26b3ff',
  '#a466ff',
  '#ff6a3c',
  '#e8e44b',
  '#ff4ec3',
];

const OFFSET_DECAY_TC_MS = 250;
const OFFSET_SNAP_THRESHOLD_PX = 300;

interface DotContentProps {
  pose: ScreenPose;
  clock: ServerClock;
  screenName: string;
}

export default function DotContent({ pose, clock, screenName }: DotContentProps) {
  const anchor = useAnchor<{ x: number; y: number }>(
    DOT_CHANNEL_ID,
    SPATIAL_STREAM_ENDPOINT,
  ) as DotAnchor | null;

  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const offsetRef = useRef<{ x: number; y: number; atServerMs: number } | null>(null);
  const prevAnchorKeyRef = useRef<string | null>(null);
  const prevDisplayedRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = anchorRef.current;
      const p = poseRef.current;
      const c = clockRef.current;
      const box = boxRef.current;
      const label = labelRef.current;

      if (!a || a.motion.kind !== 'linear2dBouncing' || !box || !label) {
        if (box) box.style.display = 'none';
        raf = requestAnimationFrame(tick);
        return;
      }

      const serverNow = c.serverNow();
      const ideal = evaluateLinear2dBouncing(a, serverNow);

      const motion = a.motion;
      const anchorKey = `${a.at}:${a.value.x},${a.value.y}:${motion.vxUnitsPerMs}:${motion.vyUnitsPerMs}:${motion.worldWidth}:${motion.worldHeight}`;
      if (anchorKey !== prevAnchorKeyRef.current) {
        if (prevDisplayedRef.current && prevAnchorKeyRef.current !== null) {
          const dx = prevDisplayedRef.current.x - ideal.x;
          const dy = prevDisplayedRef.current.y - ideal.y;
          const mag = Math.hypot(dx, dy);
          if (mag > OFFSET_SNAP_THRESHOLD_PX) {
            offsetRef.current = null;
          } else {
            offsetRef.current = { x: dx, y: dy, atServerMs: serverNow };
          }
        } else {
          offsetRef.current = null;
        }
        prevAnchorKeyRef.current = anchorKey;
      }

      let dispX = ideal.x;
      let dispY = ideal.y;
      if (offsetRef.current) {
        const elapsed = serverNow - offsetRef.current.atServerMs;
        const decay = Math.exp(-elapsed / OFFSET_DECAY_TC_MS);
        if (decay < 0.01) {
          offsetRef.current = null;
        } else {
          dispX = ideal.x + offsetRef.current.x * decay;
          dispY = ideal.y + offsetRef.current.y * decay;
        }
      }

      prevDisplayedRef.current = { x: dispX, y: dispY };

      const sw = motion.squareWidth;
      const sh = motion.squareHeight;

      const wrap = wrapRef.current;
      const screenW = wrap?.clientWidth ?? window.innerWidth;
      const screenH = wrap?.clientHeight ?? window.innerHeight;
      const { screenX, screenY, screenSw, screenSh } = mapDotToScreenPixels(
        dispX,
        dispY,
        sw,
        sh,
        p,
        screenW,
        screenH,
      );

      const fullyOff =
        screenX + screenSw <= 0 ||
        screenY + screenSh <= 0 ||
        screenX >= screenW ||
        screenY >= screenH;

      if (fullyOff) {
        box.style.display = 'none';
      } else {
        box.style.display = '';
        box.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
        box.style.width = `${screenSw}px`;
        box.style.height = `${screenSh}px`;
        box.style.background = DOT_COLORS[ideal.bounceCount % DOT_COLORS.length]!;
        label.textContent = `${screenName}\n(${Math.round(ideal.x)}, ${Math.round(ideal.y)})\nbounces ${ideal.bounceCount}`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screenName]);

  return (
    <div ref={wrapRef} className="fixed inset-0 overflow-hidden bg-[#0a0a0a]">
      <div
        ref={boxRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{
          transform: 'translate3d(0,0,0)',
          display: 'none',
        }}
      >
        <div
          ref={labelRef}
          className="flex h-full w-full flex-col items-center justify-center whitespace-pre-line text-center font-mono text-[clamp(10px,2vmin,18px)] text-white mix-blend-difference"
        />
      </div>
    </div>
  );
}
