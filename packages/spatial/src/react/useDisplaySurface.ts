'use client';

import type { RenderMode, ScreenEntry } from '../types';
import { useSelfScreen } from './useSelfScreen';
import { useSpatialSnapshot } from './useSpatialSnapshot';

export interface UseDisplaySurfaceOptions {
  screenName: string;
  streamEndpoint: string;
  apiBase: string;
  metaKey?: string;
  heartbeat?: boolean;
}

export function useDisplaySurface({
  screenName,
  streamEndpoint,
  apiBase,
  metaKey,
  heartbeat = true,
}: UseDisplaySurfaceOptions) {
  const { spatial, snapshot, connected } = useSpatialSnapshot({
    streamEndpoint,
    metaKey,
  });

  const { entry, deleted } = useSelfScreen({
    screenName,
    spatial,
    apiBase,
    enabled: heartbeat && !!screenName,
  });

  const renderMode: RenderMode = spatial?.renderMode ?? 'calibration';
  const pose = entry?.pose ?? null;
  const identifyTrigger = spatial?.identifyTrigger ?? null;

  return {
    spatial,
    snapshot,
    connected,
    entry: entry as ScreenEntry | null,
    pose,
    renderMode,
    isCalibration: renderMode === 'calibration',
    isContent: renderMode === 'content',
    deleted,
    identifyTrigger,
  };
}
