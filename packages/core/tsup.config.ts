import { defineConfig } from 'tsup';

// Three published entry points mirroring the `exports` map:
//   .        → everything (index)
//   ./server → React-free protocol + server surface
//   ./react  → client hooks
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/server-entry.ts',
    react: 'src/react-entry.ts',
  },
  format: ['esm'],
  dts: { tsconfig: 'tsconfig.build.json' },
  tsconfig: 'tsconfig.build.json',
  clean: true,
  treeshake: true,
  sourcemap: true,
  external: ['react'],
});
