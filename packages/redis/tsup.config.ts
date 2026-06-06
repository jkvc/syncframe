import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  clean: true,
  treeshake: true,
  sourcemap: true,
  // ioredis (peer) and @syncframe/core (type-only) stay external.
  external: ['ioredis', '@syncframe/core'],
});
