import { Suspense } from 'react';
import { PresentationBlank } from '@syncframe/spatial/ui';
import { DotDisplay } from '../_components/DotDisplay';

export default function DotDisplayPage() {
  return (
    <Suspense fallback={<PresentationBlank />}>
      <DotDisplay />
    </Suspense>
  );
}
