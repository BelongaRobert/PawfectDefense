import { defineConfig } from 'vite';

/**
 * Base path:
 * - `/` for local, Capacitor, tunnels
 * - `/PawfectDefense/` when building for GitHub Pages (`VITE_BASE=...`)
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
