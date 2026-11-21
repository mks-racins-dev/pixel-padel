# Pixel Padel

A pixel-art padel game that runs in the browser. Play 1v1 or 2v2 against the CPU, or 1v1 with two players on one keyboard.

Play online: https://mks-racins-dev.github.io/pixel-padel/

## Development

Requires Node 20+.

```sh
npm install
npm run dev        # local dev server with hot reload
npm test           # rules, physics and determinism tests (Vitest)
npm run typecheck  # TypeScript check (new code is .ts; older modules are being migrated)
npm run build      # production build into dist/
npm run check      # all of the above, same as CI
```

Every push to `main` runs CI and deploys `dist/` to GitHub Pages.

### Code layout

| Path | What lives there |
|---|---|
| `src/main.js` | Boot: runs each module's `setup()`, builds the scene, starts the game loop |
| `src/state.js` | Shared mutable game state (`S.ball`, `S.players`, `S.state`, ...) |
| `src/core/` | Canvas, projection and drawing helpers (`gfx`), seeded RNG (`rng.ts`), analytics (`analytics.ts`) |
| `src/game/` | Constants, settings, players, rules and scoring, ball physics, the fixed-step `update` |
| `src/ai/` | CPU opponents and partners |
| `src/input/` | Keyboard and touch input |
| `src/render/` | Background, venues, sprites, mascots, main render pass |
| `src/content/` | Data: venues and towns, mascot phrases |
| `src/ui/` | Menus, HUD, player preview |
| `src/net/` | Online play (PeerJS, host-authoritative) |
| `src/audio/` | Synthesized sound effects |
| `test/` | Vitest tests |

### Determinism

Everything that affects a rally (ball, rules, AI) uses the seeded RNG in `src/core/rng.ts`, and the simulation runs at a fixed 120 Hz step. The same seed and the same inputs give the same match. Cosmetic randomness (mascot, sounds, screen shake) uses `Math.random` and never changes the outcome. This is the base for replays and server-checked online play.

### Game server (online play)

Online matches run on a small game server on Cloudflare Workers (`server/`). It runs the same simulation code as the browser: players send only their inputs and draw the snapshots the server sends back, so nobody can fake a point. Each match is its own Durable Object; a lobby object pairs players for quick matches.

```sh
npm run server:dev                                  # local server on http://localhost:8787
VITE_SERVER_URL=ws://localhost:8787 npm run dev     # game that uses the local server
```

Without `VITE_SERVER_URL` the game falls back to peer-to-peer online play (PeerJS).

With a server, every player quietly gets an anonymous **guest account** (an id and a random token kept in the browser; the server stores only a hash of the token). It is used for the nickname, a cloud backup of the profile, the server clock for daily challenges, and the **ranked ladder**: *Find an opponent* matches are ranked with Glicko-2 in monthly seasons, private rooms are friendly. Server API: see the comment at the top of `server/worker.js`.

After changing anything in `server/`, deploy it again with `npm run server:deploy` (or let CI do it once the Cloudflare secrets are set). The `v2` migration in `server/wrangler.toml` creates the account and ladder storage on the next deploy.

**Deploying (one time):**
1. Create a free Cloudflare account, then run `npx wrangler login` and `npm run server:deploy`. Wrangler prints the server address, e.g. `https://pixel-padel-server.<your-subdomain>.workers.dev`.
2. In the GitHub repository settings, add the variable `SERVER_URL` = that address with `wss://` instead of `https://`. The next push builds the game with online play through the server.
3. Optional, for automatic server deploys from CI: add the secrets `CLOUDFLARE_API_TOKEN` (a token with the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`.

Allowed pages are set in `server/wrangler.toml` (`ALLOWED_ORIGINS`).

### Analytics

`src/core/analytics.ts` records sessions, returning days and match start/end/quit. By default nothing leaves the browser. To collect events, set the `ANALYTICS_URL` repository variable (or `VITE_ANALYTICS_URL` locally); events are POSTed there in small anonymous batches.

## Controls

- Move: WASD / arrows
- Hit: Space or J (hold left/right to aim, high balls become smashes)
- Lob: K or Shift
- Vibora: L or E (when the energy bar is full)
- Hold hit/lob longer for more power; a quick tap plays a soft drop shot near the net
- 2-player mode: P1 WASD + F/G (R = vibora), P2 arrows + K/L (O = vibora)

## Shots

- **Bandeja**: hit a high ball softly for a sliced overhead that stays low after the bounce.
- **Smash**: hit a high ball hard. At max power near the net it becomes a **por tres** and kicks out over the side fence.
- **Chiquita**: a soft hit from the back of the court dips at the feet of players at the net.
- **Wall shot**: let the ball come off your back glass after the bounce, then hit it for extra pace.
- **Contrapared**: when the ball gets past you, hold back (towards your own wall) and hit: the ball goes into your back glass and rebounds over the net.
- Gamepads work too: A hit, B lob, Y vibora, Start pause.

## Practice

Pick **PRACTICE** in the menu. A ball machine feeds you balls through five short drills (rally, back glass, lob, overheads, vibora). It doubles as the tutorial, and progress is saved on your device.

## Rules

Serve diagonally into the box. The ball must bounce before touching the other side's walls; after the bounce the glass is in play. Second bounce = point. Golden point at 40-40.

## Energy & vibora

Every hit fills your energy bar (smashes fill it faster, winning a point adds a little). When it's full you can hit a vibora: a very fast shot into the corner with side spin that kicks into the side glass. Taking a vibora gives the receiving side +30 energy, so the comeback is on.
