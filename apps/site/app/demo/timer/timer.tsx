'use client';

import { useEffect, useRef, useState } from 'react';
import { useServerClock, useAnchor } from '@syncframe/core/react';
import type { ScalarMotion } from '@syncframe/core/react';
import Pill from '@/components/editorial/Pill';
import StampShell from '@/components/ui/StampShell';
import { currentValue, speedMultiplier, isRunning, TIMER_CHANNEL_ID, type TimerAction } from '@/lib/timer';

export function Timer() {
  const clock = useServerClock('/api/clock');
  const { serverNow } = clock;

  const anchor = useAnchor<number, ScalarMotion>(TIMER_CHANNEL_ID, '/api/timer/stream');
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  const [display, setDisplay] = useState(0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const a = anchorRef.current;
      if (a) setDisplay(currentValue(a, serverNow()));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [serverNow]);

  const sendAction = async (action: TimerAction) => {
    setPending(true);
    try {
      await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } finally {
      setPending(false);
    }
  };

  const running = anchor ? isRunning(anchor) : false;
  const speed = anchor ? speedMultiplier(anchor) : 0;
  const synced = clock.sampleCount > 0;

  const [whole, fraction] = display.toFixed(2).split('.');

  return (
    <StampShell variant="card" bleed={false}>
      <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="font-mono text-[4rem] font-bold leading-none tracking-tight text-ink sm:text-[5rem]">
          {whole}
          <span className="text-ink-faint">.{fraction}</span>
        </div>
        <div className="caption-mono mt-2 text-ink-faint">Seconds</div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Pill
            onClick={() => sendAction('reset')}
            disabled={pending}
            size="xs"
          >
            Reset 60s
          </Pill>
          <Pill
            onClick={() => sendAction('toggle')}
            disabled={pending}
            active
            size="xs"
          >
            {running ? 'Pause' : 'Start'}
          </Pill>
          <Pill
            onClick={() => sendAction('speed')}
            disabled={pending || !running}
            size="xs"
          >
            Speed {running ? speed : 1}x
          </Pill>
        </div>

        <p className="caption-mono mt-6 text-hot">
          {synced ? 'Synced to server clock' : 'Syncing clock…'}
        </p>
      </div>
    </StampShell>
  );
}
