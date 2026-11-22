# Pixel Padel: roadmap to a commercial release

Goal: grow Pixel Padel from a browser game into a paid game on Steam and Nintendo Switch, with the web version as a free demo.

The plan assumes one developer working part-time, plus a hired pixel artist and composer from Phase 2. Each phase ends with a **go/no-go check**: put more time and money in only when players show they want the game.

Status key: ✅ done · 🟡 partly done · ⬜ not started

Last updated: 2026-11-22 (story career: Acts 1–4, endless seasons)

---

## Why this can work

- **Empty niche.** Padel is one of the fastest-growing sports (Spain, Italy, Sweden, the Middle East, Latin America, and now the UK and US), and there is almost no good padel game.
- **The core is right.** Glass walls, double bounce, golden point, the vibora and the wall shots are what make padel different from tennis, and the game already has them.
- **Cheap to build and run.** Pixel art in the browser, no servers until Phase 3.

**Biggest risk: players not coming back, not missing features.** If people don't come back for "one more match", more modes and countries won't fix it. Every phase is checked against retention first.

---

## Phase 0: Foundation ✅

**Goal:** make the code easy to grow without changing the gameplay.

| Item | Status |
|---|---|
| Split the single HTML file into modules (Vite) | ✅ |
| TypeScript set up for gradual migration (new code in `.ts`) | ✅ |
| Seeded randomness for everything that affects a rally, so the same seed gives the same match | ✅ |
| Analytics: sessions, returning days, match start/end/quit (nothing leaves the browser until an endpoint is set) | ✅ |
| Automated tests (rules, physics, determinism) | ✅ |
| CI on every push, automatic deploy to GitHub Pages | ✅ |

---

## Phase 1: Feel and depth 🟡

**Goal:** make a single rally fun enough that people play again.

| Item | Status |
|---|---|
| Hit effects: freeze frames, camera punch, slow motion on match point, particles | ✅ |
| New shots: bandeja, por tres, chiquita | ✅ |
| Contrapared (hit into your own back glass) | ✅ |
| Wall shot off the back glass | ✅ |
| Gamepad support | ✅ |
| Practice mode with 5 drills (also the tutorial) | ✅ |
| Country backgrounds, Moscow fixed | ✅ |
| Key remapping | ⬜ |
| "Simple controls" option | ⬜ |
| Doubles partner AI (both up / both back, covering the middle) | ⬜ dropped for now |

**Gate:** post a build on itch.io and r/padel and aim for at least 1,000 players. Look for **25% or more coming back the next day** and an average session of **10+ minutes**. Below that, keep improving Phase 1 before moving on.

---

## Phase 2: Reasons to come back 🟡

**Goal:** give people a reason to play "one more match".

| Item | Status |
|---|---|
| Saved profile (versioned, repairs damaged saves) | ✅ |
| XP, levels, skill points (speed, power, accuracy, wall play) | ✅ |
| Story career: 4 acts, 25 matches, about 30 story scenes | ✅ |
| Act 1: town map, 4 street courts with physics twists (wind, sand, chain-link fence, low roof), dares and prizes | ✅ |
| Acts 2–4: knockout tournaments, ranking points and world rank, Kebab King sponsor goals | ✅ |
| Act 3: no bounce marker (coach away), playing identity with a permanent bonus | ✅ |
| Act 4: press conferences and fans, El Maestro final, world #1 and epilogue | ✅ |
| Endless seasons after the story: 3 seeded title defences a week, defence streaks, crown trail | ✅ |
| Unlockable ball trails | ✅ |
| Daily and weekly challenges | ✅ |
| Weekly Cup (same seeded knockout for everyone each week) | ✅ |
| New main menu (side list with detail panels, keyboard and gamepad) | ✅ |
| Different looks for career opponents | ⬜ |
| Doubles partner and chemistry in career (set up by the Ruta story) | ⬜ |
| More cosmetics: outfits, rackets, celebrations | ⬜ |
| Cloud saves | ✅ (Phase 3) |
| Pixel artist: sprite sheets, animations, venues | ⬜ hire |
| Composer: one chiptune track per country, sound effects | ⬜ hire |

**Gate:** **15% or more still playing after 7 days**, and players finishing at least Act 1 (King of the Court). Launch the Steam "Coming Soon" page and aim for **5,000+ wishlists**.

---

## Phase 3: Real online play 🟡

**Goal:** a fair, competitive online mode.

| Item | Notes |
|---|---|
| Server-run matches | ✅ Cloudflare Workers + Durable Objects; the server runs the same simulation code, players send inputs only. Quick match (lobby) and private rooms with codes. Built and tested locally; deploying needs a Cloudflare account. |
| Matchmaking and rankings | ✅ random pairing (ranked) and private rooms (friendly); Glicko-2 rating, monthly seasons, Top 10 ladder; quitting a ranked match counts as a loss. 🟡 matchmaking by rating (pairs whoever is waiting for now) |
| Online 2 vs 2 | You and a friend, or you plus an AI partner |
| Accounts | ✅ anonymous guest accounts with a nickname (no sign-up). ⬜ Steam login, friends, clubs, leaderboards by country and city |
| Weekly Cup leaderboard | ⬜ needs server-side replay of the recorded match to trust results; browsers can differ slightly in math functions, so the simulation must first avoid them (or the server must tolerate tiny differences) |
| Server-side checks | ✅ matches are server-run (inputs only, clamped, rate-limited); challenge days and weeks use the server clock. 🟡 challenge progress itself is still counted in the browser |
| Cloud saves | ✅ the profile is backed up to the guest account; the newer of local and cloud wins |

**Gate:** a closed beta with 200+ players, average connection delay under 120 ms in Europe, matchmaking in under 60 seconds.

---

## Phase 4: Launch ⬜

| Item | Notes |
|---|---|
| Steam Early Access at $9.99 | Steam Deck verified, achievements, cloud saves |
| Web demo | One venue and quick matches, with a link to Steam |
| Marketing | Short TikTok/Reels/Shorts clips of wall shots and viboras, padel influencers and clubs, Steam Next Fest |
| Translations | English, Spanish, Italian, Swedish, Portuguese, French |

**Target:** 10,000+ copies in the first 3 months and 80% or more positive Steam reviews.

---

## Phase 5: Growth ⬜

| Item | Notes |
|---|---|
| Nintendo Switch port | Local 2 vs 2 couch play sells well there |
| Mobile | Free with cosmetics only, no pay-to-win; touch controls redesigned from scratch |
| Brand deals | Branded courts and rackets (Bullpadel, Head, Babolat), club and tournament sponsorship |
| Live updates | New venues and shots each season, in-game events tied to the real pro tour |

---

## Budget (rough, to Early Access)

| Item | Estimate |
|---|---|
| Pixel artist (Phases 2–4) | $6–12k |
| Composer and sound | $2–4k |
| Servers (beta and launch) | $50–300/month |
| Steam fee + marketing assets | $100 + $1–3k |
| Translations | $2–4k |
| **Total** | **about $12–25k** |

---

## Risks

| Risk | How we handle it |
|---|---|
| Players don't come back | The Phase 1 and Phase 2 gates catch this before money goes into servers and marketing |
| Online is technically hard | The simulation is already seeded and deterministic; the game can launch with AI partners if online slips |
| Small audience | Padel players are a niche, so the game must also be fun for arcade-sports players; the padel community is how we reach them |
| Scope creep | Anything that doesn't move retention or wishlists waits for Phase 5 |
| Cheating with the device clock or local saves | Accepted until Phase 3 moves challenges and progress to the server |

---

## Next steps

1. **Playtest** the story career from Act 1 to the El Maestro final: tune opponent skill, court twists (`wind`, `roof` in `src/meta/career.ts`), XP and ranking points. Also check the 5 practice drills and the new menu.
2. **Run the Phase 1 gate:** post the web build on itch.io and r/padel, and set `ANALYTICS_URL` so retention can be measured.
3. Write briefs for the pixel artist and composer.
4. Finish the small Phase 1 leftovers (key remapping, simple controls) if playtests ask for them.
