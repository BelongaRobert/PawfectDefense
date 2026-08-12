import { defineConfig } from 'vite';

// Local/tunnel: `/`. GitHub Pages project site needs the repo name prefix.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/PawfectDefense/' : '/',
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
}));
