'use client';

import { useEffect, useRef, useState } from 'react';
import { useServerClock, useAnchor } from '@syncframe/core/react';
import type { ScalarMotion } from '@syncframe/core/react';
import { currentValue, speedMultiplier, isRunning, ROOM_ID, CHANNEL_ID, type TimerAction } from '@/lib/timer';
import styles from '../demo.module.css';

export function Timer() {
  // NTP-style synced server clock — `serverNow()` returns live server time so
  // all browsers evaluate the anchor against the same clock.
  const clock = useServerClock('/api/clock');
  const { serverNow } = clock;

  // Subscribe to the room's CoreSnapshot stream. We use useAnchor (not
  // useScalarAnchor) because the controls need the motion (rate) to show
  // play/pause and the current speed, not just the evaluated number.
  const anchor = useAnchor<number, ScalarMotion>(ROOM_ID, CHANNEL_ID, '/api/timer/stream');
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  const [display, setDisplay] = useState(0);
  const [pending, setPending] = useState(false);

  // Re-evaluate the anchor against synced server time every frame.
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
    <div className={styles.timerCard}>
      <div className={styles.timerDisplay}>
        {whole}
        <span className={styles.timerFraction}>.{fraction}</span>
      </div>
      <div className={styles.timerUnit}>SECONDS</div>

      <div className={styles.timerControls}>
        <button
          className={styles.controlButton}
          onClick={() => sendAction('reset')}
          disabled={pending}
        >
          RESET 60S
        </button>
        <button
          className={`${styles.controlButton} ${styles.controlButtonPrimary}`}
          onClick={() => sendAction('toggle')}
          disabled={pending}
        >
          {running ? 'PAUSE' : 'START'}
        </button>
        <button
          className={styles.controlButton}
          onClick={() => sendAction('speed')}
          disabled={pending || !running}
        >
          SPEED {running ? speed : 1}X
        </button>
      </div>

      <div className={styles.timerStatus}>
        {synced ? 'SYNCED TO SERVER CLOCK' : 'SYNCING CLOCK…'}
      </div>
    </div>
  );
}
