// Load the real page markup so modules that look up DOM elements find them.
import fs from 'fs';
import path from 'path';
if (typeof document !== 'undefined') { // node-environment tests (the server simulation) have no page
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  document.documentElement.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
  HTMLCanvasElement.prototype.getContext = () => null; // no canvas in jsdom; the sim never draws
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}
