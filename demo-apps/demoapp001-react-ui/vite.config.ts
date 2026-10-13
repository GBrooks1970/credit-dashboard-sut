import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Development: the Vite server proxies the API to the service on port 4000, so the browser sees one origin
// (decision brief 11 D2). Production and the harness: the service serves the built UI from the same origin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:4000' } },
  build: { outDir: 'dist', sourcemap: false },
  // An absolute base URL in tests: Node's Request rejects a relative one (a browser resolves it against the page).
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false, env: { VITE_API_BASE_URL: 'http://localhost/api/v1' } },
});
