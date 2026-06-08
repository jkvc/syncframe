import type { SpatialContentLayer } from '@syncframe/spatial/ui';
import { dotLayer } from './dot-layer';

export const SPATIAL_CONTENT_LAYERS: SpatialContentLayer[] = [dotLayer];

export const DEFAULT_SPATIAL_CONTENT_LAYER = dotLayer;

export function getSpatialContentLayer(id: string): SpatialContentLayer {
  return SPATIAL_CONTENT_LAYERS.find((l) => l.id === id) ?? DEFAULT_SPATIAL_CONTENT_LAYER;
}
