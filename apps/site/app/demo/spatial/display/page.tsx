import { Suspense } from 'react';
import { SpatialDisplay } from '../_components/SpatialDisplay';

export default function SpatialDisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-white/60">
          Loading…
        </div>
      }
    >
      <SpatialDisplay />
    </Suspense>
  );
}
