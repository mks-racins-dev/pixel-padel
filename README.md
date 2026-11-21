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

### Analytics

`src/core/analytics.ts` records sessions, returning days and match start/end/quit. By default nothing leaves the browser. To collect events, set the `ANALYTICS_URL` repository variable (or `VITE_ANALYTICS_URL` locally); events are POSTed there in small anonymous batches.

## Controls

- Move: WASD / arrows
- Hit: Space or J (hold left/right to aim, high balls become smashes)
- Lob: K or Shift
- Vibora: L or E (when the energy bar is full)
- Hold hit/lob longer for more power; a quick tap plays a soft drop shot near the net
- 2-player mode: P1 WASD + F/G (R = vibora), P2 arrows + K/L (O = vibora)

## Rules

Serve diagonally into the box. The ball must bounce before touching the other side's walls; after the bounce the glass is in play. Second bounce = point. Golden point at 40-40.

## Energy & vibora

Every hit fills your energy bar (smashes fill it faster, winning a point adds a little). When it's full you can hit a vibora: a very fast shot into the corner with side spin that kicks into the side glass. Taking a vibora gives the receiving side +30 energy, so the comeback is on.
