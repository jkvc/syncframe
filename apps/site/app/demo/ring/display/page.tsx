import { Suspense } from 'react';
import { PresentationBlank } from '@syncframe/spatial/ui';
import { RingDisplay } from '../_components/RingDisplay';

export default function RingDisplayPage() {
  return (
    <Suspense fallback={<PresentationBlank />}>
      <RingDisplay />
    </Suspense>
  );
}
