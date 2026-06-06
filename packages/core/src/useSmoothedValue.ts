/**
 * @syncframe/core — smoothed value hook.
 *
 * Takes an evaluated anchor value and applies exponential chase smoothing.
 * Returns the smoothed value for rendering. Uses refs internally to avoid
 * re-subscribing the rAF loop on every state change.
 */

import { useEffect, useRef, useState } from 'react';
import { smoothStep } from './smoother';
import type { SmootherOptions } from './types';

export function useSmoothedValue(
    value: number,
    options?: SmootherOptions,
): number {
    const [smoothed, setSmoothed] = useState(value);
    const lastUpdateRef = useRef<number>(performance.now());
    const targetRef = useRef(value);
    const smoothedRef = useRef(value);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        targetRef.current = value;
    }, [value]);

    useEffect(() => {
        let raf: number;

        const tick = () => {
            const now = performance.now();
            const dt = now - lastUpdateRef.current;
            lastUpdateRef.current = now;

            const nextValue = smoothStep(targetRef.current, smoothedRef.current, dt, optionsRef.current);
            smoothedRef.current = nextValue;
            setSmoothed(nextValue);

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    return smoothed;
}
