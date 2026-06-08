'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HEARTBEAT_INTERVAL_MS,
  type ScreenEntry,
} from '../types';
import type { SpatialMeta } from '../types';

export interface UseSelfScreenOptions {
  screenName: string;
  spatial: SpatialMeta | null;
  apiBase: string;
  enabled?: boolean;
}

function randomSessionId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function useSelfScreen({
  screenName,
  spatial,
  apiBase,
  enabled = true,
}: UseSelfScreenOptions): {
  entry: ScreenEntry | null;
  sessionId: string;
  deleted: boolean;
} {
  const sessionIdRef = useRef(randomSessionId());
  const [heartbeatDeleted, setHeartbeatDeleted] = useState(false);

  const entry = useMemo(() => {
    if (!spatial || !screenName) return null;
    return spatial.screens[screenName] ?? null;
  }, [spatial, screenName]);

  const snapshotDeleted = useMemo(() => {
    if (!screenName || !spatial) return false;
    return !(screenName in spatial.screens);
  }, [spatial, screenName]);

  const deleted = heartbeatDeleted || snapshotDeleted;

  const sendHeartbeat = useCallback(async () => {
    if (!enabled || !screenName || deleted) return;
    const res = await fetch(`${apiBase}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screenName,
        sessionId: sessionIdRef.current,
        clientWidthPx: window.innerWidth,
        clientHeightPx: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent,
      }),
    });
    if (res.status === 404) setHeartbeatDeleted(true);
  }, [apiBase, deleted, enabled, screenName]);

  useEffect(() => {
    if (!enabled || !screenName || deleted) return;
    void sendHeartbeat();
    const id = setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [deleted, enabled, screenName, sendHeartbeat]);

  return {
    entry,
    sessionId: sessionIdRef.current,
    deleted,
  };
}
