// House rules of the street courts. Career events set their own; quick play at a street venue
// uses these so every street court plays a little differently. Kept free of page code (the sim runs on the server too).
export const VENUE_RULES = {
  roof: { wind: 0.7 },
  market: { deadBack: true },
  camp: { sand: true },
  ware: { roof: 5.6 },
  yard: { roof: 7.2 },
  beach: { sand: true, wind: 0.4 },
  docks: { wind: 0.5 },
};
export const VENUE_TWIST = {
  roof: 'WIND PUSHES HIGH BALLS',
  market: 'CHAIN-LINK BACK: NO GLASS',
  camp: 'SAND: LOW, DEAD BOUNCES',
  ware: 'LOW BEAMS: NO BIG LOBS',
  yard: 'WASHING LINES: NO BIG LOBS',
  beach: 'SAND AND A SEA BREEZE',
  docks: 'HARBOUR WIND',
};
export const QUICK_RULE_MODES = ['1v1', '2v2', 'pvp', 'couch'];
