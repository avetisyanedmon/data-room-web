import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The app leaves VITE_API_URL unset in development so the Vite dev proxy
    // serves /api same-origin. Under jsdom there is no proxy and no document
    // base for undici to resolve against, so a relative base makes every
    // request throw "Failed to parse URL" before it reaches the fetch stub.
    // Tests never hit this origin — the stub answers first — it only has to
    // be absolute.
    env: { VITE_API_URL: 'http://localhost:3000/api' },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/features/upload/types.ts'],
    },
  },
});
