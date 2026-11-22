// Act 1 story scenes: short dialogue cards shown in the career panel.
// `pre` scenes play before an event's match, the others play once when their condition is met.
// Each line is [speaker, text]. Speakers: the key into WHO (name and portrait colours).

export const WHO = {
  you: { name: 'YOU', c: '#e4572e', hair: '#3a2a20' },
  tomi: { name: 'TOMI', c: '#6fd3d2', hair: '#d8a040' },
  ray: { name: 'COACH RAY', c: '#c9bba6', hair: '#e8e8e8' },
  ruta: { name: 'RUTA', c: '#b05cc8', hair: '#151018' },
  dani: { name: 'BIG DANI', c: '#f2c14e', hair: '#5a3a20' },
  note: { name: '', c: '#2a2333', hair: '#2a2333' },
};

export const SCENES = [
  { id: 'intro', when: c => !c.won.length, lines: [
    ['note', 'Your first week in a new town. In your aunt\'s garage, under a bike, you find an old padel racket.'],
    ['tomi', 'Is that a racket? You play? Friday is King of the Court at Sunset Club!'],
    ['tomi', 'It\'s not a real tournament. The sign-up sheet is a napkin. The trophy is a spray-painted shuttlecock.'],
    ['tomi', 'Warm up against me first. Don\'t worry, I\'m terrible.'],
  ] },
  { id: 'ray', when: c => c.won.includes('a1_tomi'), lines: [
    ['note', 'An old man at the bar has been watching your match the whole time.'],
    ['ray', 'You hit like a tennis player. Padel is a game of walls, kid.'],
    ['ray', 'Nobody gets into King of the Court without a name. You get a name on the street courts.'],
    ['ray', 'Rooftop, supermarket, campsite, warehouse. Beat the locals. Win their dares and they\'ll give you something to remember.'],
    ['tomi', 'That\'s COACH RAY. He used to be a pro. Like, a real one.'],
  ] },
  { id: 'ruta', pre: 'a1_ruta', lines: [
    ['note', 'Late evening. Someone is already on your court, hitting smashes against the glass.'],
    ['ruta', 'This is your court? Cute. I\'m RUTA. I\'m only in town for a week.'],
    ['ruta', 'Everyone says you\'re the new name around here. Show me.'],
    ['ray', '(quietly) She plays the Baltic tour. Learn what you can.'],
  ] },
  { id: 'ruta_win', when: c => c.seen.includes('beat:a1_ruta'), lines: [
    ['ruta', '...Lucky. I\'m tired from the trip.'],
    ['ruta', 'See you on the tour. If you ever get there.'],
    ['ray', 'Ha! Did you see her face? Friday. You\'re ready.'],
  ] },
  { id: 'ruta_loss', when: c => c.won.includes('a1_ruta') && !c.seen.includes('beat:a1_ruta'), lines: [
    ['ruta', 'Not bad. For a town player.'],
    ['ruta', 'See you on the tour. If you ever get there.'],
    ['ray', 'Don\'t look at the floor. She plays every week, you started a month ago.'],
    ['ray', 'Now you know what good looks like. Friday, King of the Court.'],
  ] },
  { id: 'king', pre: 'a1_king', lines: [
    ['note', 'Friday night. The bar is full. Someone wrote your name on the napkin in ketchup.'],
    ['dani', 'Three years I\'ve been King of this court. Three years!'],
    ['dani', 'Kid, the shuttlecock stays with me.'],
    ['tomi', 'Everyone\'s watching. No pressure!'],
  ] },
  { id: 'act1', when: c => c.won.includes('a1_king'), lines: [
    ['note', 'The napkin trophy is yours. The whole bar sings your name, badly.'],
    ['ray', 'Kid. I got a call. There\'s a spot in the BALTIC TOUR. Real brackets, real ranking points.'],
    ['ray', 'I still have my old van. It mostly works.'],
    ['tomi', 'You\'re leaving? Take the shuttlecock. And send me a postcard!'],
    ['note', 'ACT 1 COMPLETE. THE BALTIC TOUR IS OPEN.'],
  ] },
];

/** The first unseen scene that should play now, outside of a pre-match moment. */
export const pendingScene = c => SCENES.find(s => !s.pre && !c.seen.includes(s.id) && s.when(c));
/** The unseen scene to play before an event, if any. */
export const preScene = (c, eventId) => SCENES.find(s => s.pre === eventId && !c.seen.includes(s.id));
