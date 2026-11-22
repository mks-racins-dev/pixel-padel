// Act 1 story scenes: short dialogue cards shown in the career panel.
// `pre` scenes play before an event's match, the others play once when their condition is met.
// Each line is [speaker, text]. Speakers: the key into WHO (name and portrait colours).

export const WHO = {
  you: { name: 'YOU', c: '#e4572e', hair: '#3a2a20' },
  tomi: { name: 'TOMI', c: '#6fd3d2', hair: '#d8a040' },
  ray: { name: 'COACH RAY', c: '#c9bba6', hair: '#e8e8e8' },
  ruta: { name: 'RUTA', c: '#b05cc8', hair: '#151018' },
  dani: { name: 'BIG DANI', c: '#f2c14e', hair: '#5a3a20' },
  kebab: { name: 'KEBAB KING', c: '#c4613a', hair: '#f4ead2' },
  dasha: { name: 'DASHA', c: '#3d4a8a', hair: '#e8e0d0' },
  maestro: { name: 'EL MAESTRO', c: '#1d1a24', hair: '#9a9aa8' },
  press: { name: 'REPORTER', c: '#6fd3d2', hair: '#2a2333' },
  note: { name: '', c: '#2a2333', hair: '#2a2333' },
};

export const SCENES = [
  { id: 'intro', cine: 'park', when: c => !c.won.length, lines: [
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
  // ---------------- act 2: the baltic tour ----------------
  { id: 'van1', pre: 'b_riga1', lines: [
    ['note', 'Six in the morning. Ray\'s van coughs twice, then starts. Tomi waves from the pavement until you turn the corner.'],
    ['ray', 'Rules of the road. One: real brackets. You lose, you go home.'],
    ['ray', 'Two: every round you win gives ranking points. Right now you are number 412 in the world.'],
    ['you', 'Is that good?'],
    ['ray', 'It means you exist. First stop: the RIGA OPEN.'],
  ] },
  { id: 'knocked', when: c => c.seen.includes('flag:knocked'), lines: [
    ['note', 'The car park behind the venue. Your bag feels heavier than this morning.'],
    ['ray', 'Knocked out. Welcome to the tour, kid. It happens to everyone.'],
    ['ray', 'The good news: there is another bracket next week. Same city, same draw. Go again.'],
  ] },
  { id: 'riga_win', when: c => c.won.includes('b_riga3'), lines: [
    ['note', 'Your first real trophy. It is small, and it is made of real metal.'],
    ['ray', 'Look at the ranking. You moved. People will know your name in Tallinn.'],
    ['note', 'Ray\'s phone rings. He listens, laughs, and hands it to you.'],
  ] },
  { id: 'sponsor', when: c => c.seen.includes('riga_win'), lines: [
    ['kebab', 'Hello? This is the KEBAB KING. From your town! Tomi gave me your number.'],
    ['kebab', 'I put your match on the TV in the shop. Everyone was shouting!'],
    ['kebab', 'I want my logo on your shirt. I pay XP and ranking bonuses. You just do my little goals, OK?'],
    ['ray', '(whispering) Say yes. The van needs tyres.'],
    ['note', 'SPONSOR SIGNED: KEBAB KING. Goals now show on the tour screen.'],
  ] },
  { id: 'van2', pre: 'b_tal1', lines: [
    ['note', 'The road to Tallinn. Pine trees for four hours. Ray sings along to a radio station that does not exist any more.'],
    ['ray', 'MART plays in Tallinn. Big hitter. Don\'t trade power with him. Use the glass.'],
    ['you', 'Have you played him?'],
    ['ray', 'I played his father.'],
  ] },
  { id: 'van3', pre: 'b_vil1', lines: [
    ['note', 'A petrol station near the border. Ray buys two hot dogs and a map he does not need.'],
    ['ray', 'Vilnius. The BALTIC MASTERS. Everyone good is there.'],
    ['ray', 'And kid... she will be there too.'],
    ['you', 'Ruta.'],
  ] },
  { id: 'ruta2', pre: 'b_vil2', lines: [
    ['note', 'The final. A real crowd, real lights, a real umpire.'],
    ['ruta', 'Well. The town player made it to my final.'],
    ['ruta', 'Last time I was tired. This time I am not.'],
    ['ray', 'Same court as everyone else. Same walls. Play your game.'],
  ] },
  { id: 'act2', when: c => c.won.includes('b_vil2'), lines: [
    ['note', 'BALTIC MASTERS CHAMPION. The crowd chants a name. It is yours.'],
    ['ruta', '...Fine. You are good. Don\'t let it go to your head.'],
    ['kebab', '(on speaker) THAT\'S MY PLAYER! FREE KEBABS FOR A YEAR!'],
    ['ray', 'Kid. They want you in the EAST OPEN. Night matches. Serious players.'],
    ['note', 'ACT 2 COMPLETE. THE EAST OPEN IS OPEN.'],
  ] },
  // ---------------- act 3: the east open ----------------
  { id: 'ray_sick', pre: 'e_min1', lines: [
    ['note', 'The night before Minsk. The van is packed. Ray is not in it.'],
    ['ray', '(on the phone) My back is gone, kid. The doctor says no driving, no travelling. Weeks.'],
    ['you', 'Then I\'ll wait.'],
    ['ray', 'No. You go. And listen: no more help from me. No bounce marker in your head. You read the ball yourself now.'],
    ['note', 'ACT 3: NO COACH. THE BOUNCE MARKER IS OFF FOR THE EAST OPEN.'],
  ] },
  { id: 'minsk_win', when: c => c.won.includes('e_min3'), lines: [
    ['note', 'Minsk Challenger champion. You call Ray from a grey hotel room. He cheers so loud the nurse comes in.'],
    ['note', 'A knock on the door. It is Ruta.'],
    ['ruta', 'I watched your final. You play like nobody else on this tour.'],
    ['ruta', 'Next season. Doubles. You and me. We could win everything.'],
    ['you', '...Deal.'],
    ['ruta', 'Good. But first, decide who you are on court. Nobody fears a player who does a bit of everything.'],
  ] },
  { id: 'moscow', pre: 'e_mos1', lines: [
    ['note', 'Moscow. Matches start at midnight under white lights. Cold breath. Loud crowds.'],
    ['ray', '(text message) Watching on my phone. Proud of you. Get some sleep. (You will not.)'],
    ['note', 'Everyone here talks about one name: DASHA. Unbeaten at home for two years.'],
  ] },
  { id: 'ruta_drop', pre: 'e_mos3', lines: [
    ['note', 'An hour before the final, your phone buzzes. A tour news headline.'],
    ['note', '"RUTA AND DASHA ANNOUNCE DOUBLES PARTNERSHIP FOR NEXT SEASON."'],
    ['ruta', '(message) Sorry. It is business. She is number 9. You understand.'],
    ['dasha', 'You look upset. Good. Upset players miss.'],
    ['you', 'We\'ll see.'],
  ] },
  { id: 'act3', when: c => c.won.includes('e_mos3'), lines: [
    ['note', 'You beat DASHA at home, at midnight, in front of her crowd. The arena goes quiet. Then it applauds.'],
    ['ray', '(video call, standing up) Look! I\'m standing! Doctor says I can fly next month.'],
    ['ray', 'And kid. The PRO TOUR sent an invitation. Madrid. The home of padel.'],
    ['ray', 'Somebody there is waiting for me. An old friend. We will talk about him on the plane.'],
    ['note', 'ACT 3 COMPLETE. THE PRO TOUR IS OPEN.'],
  ] },
  // ---------------- act 4: the pro tour ----------------
  { id: 'plane', pre: 'p_mad1', lines: [
    ['note', 'A plane to Madrid. Ray has the window seat and a new back brace.'],
    ['you', 'So. The old friend.'],
    ['ray', 'Javier. They call him EL MAESTRO now. Twenty years ago he was my doubles partner.'],
    ['ray', 'The week before the world final, he left me for a better partner. Then he beat me in that final.'],
    ['you', '...That sounds familiar.'],
    ['ray', 'He is still number 1. Win Madrid and Miami, and you get him in the WORLD FINALS.'],
  ] },
  { id: 'madrid_win', when: c => c.won.includes('p_mad3'), lines: [
    ['note', 'MADRID MASTER CHAMPION. Cameras everywhere. Someone puts a microphone in your face.'],
    ['press', 'Two months ago nobody knew your name. What do you say to your new fans?'],
  ] },
  { id: 'miami', pre: 'p_mia1', lines: [
    ['note', 'Miami. Neon lights, palm trees, a court on the beach. It is midnight and still 30 degrees.'],
    ['kebab', 'SURPRISE! I closed the shop for a week! I have a flag with your face on it!'],
    ['ray', 'He has been here since 6 am. He told the hotel he is your manager.'],
  ] },
  { id: 'ruta_sorry', pre: 'p_mia2', lines: [
    ['note', 'In the players\' lounge, Ruta sits alone. Dasha left the partnership after one month.'],
    ['ruta', 'Go on. Say it. I deserve it.'],
    ['you', 'Win your next match. That\'s all I\'ll say.'],
    ['ruta', '...You know, El Maestro did the same to your coach. Everybody on tour knows that story.'],
    ['ruta', 'Beat him. For Ray. And maybe a little for me.'],
  ] },
  { id: 'miami_win', when: c => c.won.includes('p_mia2'), lines: [
    ['note', 'MIAMI NEON SLAM CHAMPION. The Kebab King cries on live TV.'],
    ['press', 'Next week, the World Finals against El Maestro. Are you scared?'],
  ] },
  { id: 'maestro', pre: 'p_fin', lines: [
    ['note', 'Madrid. The World Finals. Twelve thousand people. In the tunnel, a tall man in black waits.'],
    ['maestro', 'Ramon. You found a student. And a bad back, I hear.'],
    ['ray', 'Javier. You found grey hair.'],
    ['maestro', '(to you) He was the best partner I ever had. I was too young to know it. Play well, kid.'],
    ['ray', '(quietly) First to five. Every wall is yours. Go.'],
  ] },
  { id: 'act4', when: c => c.won.includes('p_fin'), lines: [
    ['note', 'WORLD CHAMPION. The arena is shaking. Somewhere in the crowd, a kebab-shaped balloon floats up.'],
    ['maestro', '(shaking Ray\'s hand) Twenty years. You finally beat me, Ramon. Through this kid.'],
    ['ray', 'No, Javier. The kid beat you. I just drove the van.'],
    ['note', 'WORLD RANK #1.'],
  ] },
  { id: 'epilogue', when: c => c.seen.includes('act4'), lines: [
    ['note', 'One week later. A parking garage rooftop. Pigeons. Wind.'],
    ['tomi', 'You came back! Everyone is here. Even Big Dani.'],
    ['note', 'On a plastic table: the world trophy, a small metal trophy from Riga, and a spray-painted shuttlecock on a napkin.'],
    ['tomi', 'So. Friday. King of the Court. You in?'],
    ['you', 'Always.'],
    ['note', 'THE END. THANK YOU FOR PLAYING. YOUR CAREER STAYS OPEN: REPLAY ANY COURT, BEAT YOUR OLD SCORES.'],
  ] },
];

/** The first unseen scene that should play now, outside of a pre-match moment. */
export const pendingScene = c => SCENES.find(s => !s.pre && !c.seen.includes(s.id) && s.when(c));
/** The unseen scene to play before an event, if any. */
export const preScene = (c, eventId) => SCENES.find(s => s.pre === eventId && !c.seen.includes(s.id));
