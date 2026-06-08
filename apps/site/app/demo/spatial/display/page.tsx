import { Suspense } from 'react';
import { PresentationBlank } from '@syncframe/spatial/ui';
import { SpatialDisplay } from '../_components/SpatialDisplay';

export default function SpatialDisplayPage() {
  return (
    <Suspense fallback={<PresentationBlank />}>
      <SpatialDisplay />
    </Suspense>
  );
}
