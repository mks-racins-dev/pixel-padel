import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // works on GitHub Pages under /pixel-padel/ and on any static host
  build: { target: 'es2020', assetsInlineLimit: 0 },
  test: { environment: 'jsdom', setupFiles: ['./test/setup.js'] },
});
