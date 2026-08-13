import { defineConfig } from 'vite';

/**
 * Base path:
 * - `/` for local, Capacitor, tunnels
 * - `./` for GitHub Pages (`npm run build:pages`) so the game works at
 *   https://belongarobert.github.io/PawfectDefense/ when Pages publishes `/docs`
 */
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
