'use client';

import { useEffect, useState } from 'react';
import type { ServerClock } from '@syncframe/core/react';
import {
  evaluateLinear2dBouncing,
  type DotAnchor,
} from '@/lib/dot';

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

interface DotMapPreviewProps {
  anchor: DotAnchor | null;
  clock: ServerClock;
}

/** Live dot rect in world coords — rAF re-render like cabin DotMapPreview. */
export default function DotMapPreview({ anchor, clock }: DotMapPreviewProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!anchor) return;
    let raf = 0;
    const tick = () => {
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  if (!anchor || anchor.motion.kind !== 'linear2dBouncing') return null;

  const pos = evaluateLinear2dBouncing(anchor, clock.serverNow());
  const active =
    anchor.motion.vxUnitsPerMs !== 0 || anchor.motion.vyUnitsPerMs !== 0;

  return (
    <rect
      x={pos.x}
      y={pos.y}
      width={anchor.motion.squareWidth}
      height={anchor.motion.squareHeight}
      fill={DOT_COLORS[pos.bounceCount % DOT_COLORS.length]}
      opacity={active ? 0.85 : 0.45}
      stroke="#111"
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
    />
  );
}
