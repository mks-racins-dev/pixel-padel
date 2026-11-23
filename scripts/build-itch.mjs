// Builds the HTML5 upload for itch.io: a production build with the game server address
// baked in, zipped with index.html at the root of the archive (what itch expects).
//   npm run build:itch                      -> itch/pixel-padel-web.zip
//   VITE_SERVER_URL=... npm run build:itch  -> use another game server
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const server = process.env.VITE_SERVER_URL || 'https://pixel-padel-server.padel-pixel.workers.dev';
const out = resolve(root, 'itch'), zip = resolve(out, 'pixel-padel-web.zip'), dist = resolve(root, 'dist');

console.log('Building with game server ' + server);
execSync('npx vite build', { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_SERVER_URL: server } });
if (!existsSync(resolve(dist, 'index.html'))) throw new Error('build failed: dist/index.html is missing');

mkdirSync(out, { recursive: true });
rmSync(zip, { force: true });
// Windows: the built-in tar (bsdtar) writes zip entries with forward slashes; PowerShell's
// Compress-Archive writes backslashes, which break the paths when itch unpacks on Linux
if (process.platform === 'win32') execSync(`tar -a -c -f "${zip}" -C "${dist}" *`, { stdio: 'inherit', shell: 'cmd.exe' });
else execSync(`cd "${dist}" && zip -qr "${zip}" .`, { stdio: 'inherit', shell: '/bin/sh' });

console.log(`\nReady for itch.io: ${zip} (${(statSync(zip).size / 1024 / 1024).toFixed(1)} MB)`);
console.log('Upload it as an HTML game, "played in the browser", viewport 960 x 540, fullscreen button on.');
