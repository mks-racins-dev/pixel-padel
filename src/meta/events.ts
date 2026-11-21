// Tiny event bus: the game reports what the local player does, meta systems (challenges) listen.
export type GameEvent =
  | { type: 'shot'; shot: string; offWall: boolean }
  | { type: 'point'; won: boolean; wall: boolean; reason: string; golden: boolean }
  | { type: 'match'; won: boolean; mode: string; venue: string; gamesLost: number; career: boolean; cup: boolean }
  | { type: 'drill'; id: string };

type Fn = (e: GameEvent) => void;
const subs: Fn[] = [];
export function on(fn: Fn) { subs.push(fn) }
export function emit(e: GameEvent) { for (const f of subs) f(e) }
