'use client';

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Syncframe</h1>

      <p>
        Dead-reckoning time sync for browsers. Sync continuous state across
        any number of devices with just a browser and an internet connection.
      </p>

      <h2>How it works</h2>
      <p>
        Instead of streaming position updates, Syncframe broadcasts rare <strong>anchors</strong> —
        a timestamp + value + motion descriptor. Every client evaluates the current state at any
        time using a shared clock. Latency doesn't matter.
      </p>

      <h2>Two layers</h2>
      <dl>
        <dt><code>@syncframe/core</code></dt>
        <dd>
          Clock synchronization, anchor protocol, evaluators, pluggable storage.
          No runtime dependencies.
        </dd>

        <dt><code>@syncframe/spatial</code></dt>
        <dd>
          Screen registry, world-coordinate poses, calibration UI.
          For multi-display setups.
        </dd>
      </dl>

      <h2>Demo: Local Counter</h2>
      <p>
        This counter is local for now — once the core library is implemented, it will sync
        across all connected tabs via anchors.
      </p>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1rem 0' }}>
        <button onClick={() => setCount(c => c - 1)} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}>−</button>
        <span style={{ fontSize: '2rem', fontVariantNumeric: 'tabular-nums', minWidth: '3rem', textAlign: 'center' }}>
          {count}
        </span>
        <button onClick={() => setCount(c => c + 1)} style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}>+</button>
      </div>

      <h2>Use cases</h2>
      <ul>
        <li><strong>Video/audio sync</strong> — synchronized playback across devices</li>
        <li><strong>Multi-screen displays</strong> — panoramic content spanning multiple monitors</li>
        <li><strong>Synchronized audio</strong> — multi-device speaker arrays</li>
        <li><strong>Shared canvas</strong> — collaborative drawing surface across tablets</li>
        <li><strong>Stage / event timers</strong> — identical countdowns across every display</li>
      </ul>

      <h2>Status</h2>
      <p style={{ color: '#888' }}>
        Early scaffolding — core library implementation in progress.
      </p>
    </div>
  );
}
