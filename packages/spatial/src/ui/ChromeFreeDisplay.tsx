'use client';

import type { ReactNode } from 'react';
import { useServerClock } from '@syncframe/core/react';
import { useDisplaySurface } from '../react/useDisplaySurface';
import CalibrationGrid from './CalibrationGrid';
import DeletedScreenOverlay from './DeletedScreenOverlay';
import IdentifyFlash from './IdentifyFlash';
import type { SpatialContentLayer } from './content-layer';

/** Fullscreen black — kiosk/presentation with no chrome or status text. */
export function PresentationBlank() {
  return <div className="fixed inset-0 bg-black" aria-hidden />;
}

export interface ChromeFreeDisplayProps {
  screenName: string;
  streamEndpoint: string;
  apiBase: string;
  clockEndpoint: string;
  contentLayer: SpatialContentLayer;
  metaKey?: string;
  heartbeat?: boolean;
  /** Kiosk mode: black screen for loading/deleted; only calibration grid + content render. */
  presentation?: boolean;
  deletedFallback?: ReactNode;
}

export default function ChromeFreeDisplay({
  screenName,
  streamEndpoint,
  apiBase,
  clockEndpoint,
  contentLayer,
  metaKey,
  heartbeat = true,
  presentation = false,
  deletedFallback,
}: ChromeFreeDisplayProps) {
  const clock = useServerClock(clockEndpoint);
  const {
    spatial,
    snapshot,
    pose,
    isCalibration,
    isContent,
    deleted,
    identifyTrigger,
    connected,
  } = useDisplaySurface({
    screenName,
    streamEndpoint,
    apiBase,
    metaKey,
    heartbeat,
  });

  if (deleted) {
    if (presentation) return <PresentationBlank />;
    return (
      <DeletedScreenOverlay screenName={screenName}>
        {deletedFallback}
      </DeletedScreenOverlay>
    );
  }

  if (!spatial || !pose || !snapshot) {
    if (presentation) return <PresentationBlank />;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] font-mono text-sm text-white/40">
        {connected ? 'Loading…' : `Connecting as ${screenName}…`}
      </div>
    );
  }

  const Display = contentLayer.Display;

  return (
    <>
      {isCalibration && (
        <CalibrationGrid
          pose={pose}
          screenName={screenName}
          spatial={spatial}
          clock={clock}
        />
      )}
      {isContent && (
        <Display
          pose={pose}
          screenName={screenName}
          snapshot={snapshot}
          clock={clock}
          spatial={spatial}
        />
      )}
      <IdentifyFlash trigger={identifyTrigger} screenName={screenName} />
    </>
  );
}
