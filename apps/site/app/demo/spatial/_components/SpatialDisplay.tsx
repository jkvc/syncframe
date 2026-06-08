'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useServerClock } from '@syncframe/core/react';
import { isValidScreenName, useDisplaySurface } from '@syncframe/spatial/react';
import {
  SPATIAL_API_BASE,
  SPATIAL_STREAM_ENDPOINT,
} from '@/lib/spatial-config';
import CalibrationGrid from './CalibrationGrid';
import DotContent from './DotContent';
import IdentifyFlash from './IdentifyFlash';

export function SpatialDisplay() {
  const params = useSearchParams();
  const screenName = params.get('screenName')?.trim() ?? '';
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const clock = useServerClock('/api/clock');

  const {
    spatial,
    pose,
    isCalibration,
    isContent,
    deleted,
    identifyTrigger,
    connected,
  } = useDisplaySurface({
    screenName,
    streamEndpoint: SPATIAL_STREAM_ENDPOINT,
    apiBase: SPATIAL_API_BASE,
    heartbeat: registered,
  });

  useEffect(() => {
    if (!screenName || registered) return;

    if (!isValidScreenName(screenName)) {
      setRegisterError('Invalid screen name (1–32 chars: letters, digits, _ -)');
      return;
    }

    setRegisterError(null);
    void fetch(`${SPATIAL_API_BASE}/screens/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: screenName }),
    }).then(async (res) => {
      if (res.ok) {
        setRegistered(true);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setRegisterError(body.error ?? 'Registration failed');
    });
  }, [screenName, registered]);

  if (!screenName) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-white/80">
        <p>
          Add <code className="font-mono">?screenName=your-name</code> to the URL.
        </p>
      </div>
    );
  }

  if (registerError) {
    return (
      <div className="flex h-full items-center justify-center bg-red-950 p-8 text-center text-white">
        <p>{registerError}</p>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="flex h-full items-center justify-center bg-red-950 p-8 text-center text-white">
        <p>Screen &quot;{screenName}&quot; was deleted by the operator.</p>
      </div>
    );
  }

  if (!spatial || !pose) {
    return (
      <div className="flex h-full items-center justify-center text-white/60">
        {connected ? 'Loading…' : 'Connecting…'}
      </div>
    );
  }

  return (
    <>
      {isCalibration && (
        <CalibrationGrid
          pose={pose}
          screenName={screenName}
          worldBbox={spatial.worldBbox}
          clock={clock}
        />
      )}
      {isContent && (
        <DotContent pose={pose} clock={clock} screenName={screenName} />
      )}
      <IdentifyFlash trigger={identifyTrigger} screenName={screenName} />
    </>
  );
}
