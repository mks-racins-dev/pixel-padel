// Menu language: English, Russian, Latvian. Static menu text carries data-i18n="key";
// panels built in code call t(key). Story and career texts stay in English for now.
import { OPTS } from '../game/opts.js';

const D = {
  career: ['CAREER', 'КАРЬЕРА', 'KARJERA'],
  quick: ['QUICK MATCH', 'БЫСТРЫЙ МАТЧ', 'ĀTRA SPĒLE'],
  daily: ['DAILY', 'ЗАДАНИЯ', 'UZDEVUMI'],
  cup: ['WEEKLY CUP', 'КУБОК НЕДЕЛИ', 'NEDĒĻAS KAUSS'],
  practice: ['PRACTICE', 'ТРЕНИРОВКА', 'TRENIŅŠ'],
  online: ['ONLINE', 'ОНЛАЙН', 'TIEŠSAISTĒ'],
  player: ['PLAYER', 'ИГРОК', 'SPĒLĒTĀJS'],
  help: ['HOW TO PLAY', 'КАК ИГРАТЬ', 'KĀ SPĒLĒT'],
  options: ['OPTIONS', 'НАСТРОЙКИ', 'IESTATĪJUMI'],
  q_mode: ['MODE', 'РЕЖИМ', 'REŽĪMS'], q_cpu: ['CPU', 'УРОВЕНЬ', 'LĪMENIS'], q_len: ['LENGTH', 'ДЛИНА', 'GARUMS'], q_venue: ['VENUE', 'КОРТ', 'LAUKUMS'],
  q_tour: ['TOUR', 'ТУР', 'TŪRE'], q_street: ['STREET COURTS', 'УЛИЧНЫЕ', 'IELU LAUKUMI'], q_card: ['MATCH CARD', 'КАРТОЧКА МАТЧА', 'SPĒLES KARTE'], q_start: ['START ▸', 'СТАРТ ▸', 'SĀKT ▸'],
  o_assist: ['ASSIST', 'ПОДСКАЗКА', 'PALĪGS'], o_bounce: ['BOUNCE MARK', 'МЕТКА ОТСКОКА', 'ATSITIENA ZĪME'], on: ['ON', 'ВКЛ', 'IESL.'], off: ['OFF', 'ВЫКЛ', 'IZSL.'],
  o_sound: ['SOUND', 'ЗВУК', 'SKAŅA'], o_sfx: ['EFFECTS', 'ЭФФЕКТЫ', 'EFEKTI'], o_music: ['MUSIC', 'МУЗЫКА', 'MŪZIKA'], o_shake: ['SHAKE', 'ТРЯСКА', 'KRATĪŠANA'],
  o_lang: ['LANGUAGE', 'ЯЗЫК', 'VALODA'], o_screen: ['SCREEN', 'ЭКРАН', 'EKRĀNS'], o_full: ['FULLSCREEN', 'НА ВЕСЬ ЭКРАН', 'PILNEKRĀNS'], o_window: ['WINDOW', 'В ОКНЕ', 'LOGĀ'],
  o_keys: ['KEYS', 'КЛАВИШИ', 'TAUSTIŅI'], o_move: ['MOVE', 'ДВИЖЕНИЕ', 'KUSTĪBA'], hit: ['HIT', 'УДАР', 'SITIENS'], lob: ['LOB', 'СВЕЧА', 'SVECE'],
  o_press: ['PRESS A KEY…', 'НАЖМИТЕ…', 'NOSPIED…'], o_reset: ['RESET KEYS', 'СБРОСИТЬ КЛАВИШИ', 'ATJAUNOT TAUSTIŅUS'],
  hint_nav: ['▲▼ CHOOSE · ENTER PLAY', '▲▼ ВЫБОР · ENTER ИГРАТЬ', '▲▼ IZVĒLE · ENTER SPĒLĒT'],
  hint_pad: ['D-PAD CHOOSE · Ⓐ PLAY', 'КРЕСТОВИНА ВЫБОР · Ⓐ ИГРАТЬ', 'KRUSTIŅŠ IZVĒLE · Ⓐ SPĒLĒT'],
  // how to play
  h_controls: ['CONTROLS', 'УПРАВЛЕНИЕ', 'VADĪBA'], h_shots: ['SHOTS', 'УДАРЫ', 'SITIENI'], h_rules: ['RULES', 'ПРАВИЛА', 'NOTEIKUMI'],
  h_hold: ['hold = power', 'держать = сила', 'turēt = spēks'], h_pause: ['PAUSE', 'ПАУЗА', 'PAUZE'],
  s_drive: ['DRIVE', 'ДРАЙВ', 'DRAIVS'], s_drive_d: ['Hold HIT, release as the ball comes. Longer hold = harder and deeper.', 'Держите УДАР и отпустите, когда подлетит мяч. Дольше — сильнее и глубже.', 'Turi SITIENU, atlaid, kad bumba ir klāt. Ilgāk — stiprāk un dziļāk.'],
  s_drop: ['DROP', 'УКОРОТКА', 'ĪSAIS'], s_drop_d: ['Just tap HIT: a soft ball that dies just over the net.', 'Коротко нажмите УДАР: мягкий мяч падает сразу за сеткой.', 'Īsi piesit SITIENU: mīksta bumba nokrīt aiz tīkla.'],
  s_lob: ['LOB', 'СВЕЧА', 'SVECE'], s_lob_d: ['High and deep over players at the net. Lands past the service line.', 'Высоко и глубоко за спину игрокам у сетки.', 'Augstu un dziļi pāri spēlētājiem pie tīkla.'],
  s_bandeja: ['BANDEJA', 'БАНДЕХА', 'BANDEHA'], s_bandeja_d: ['High ball + soft HIT: a sliced shot that stays low after the glass.', 'Высокий мяч + мягкий УДАР: резаный, остаётся низким после стекла.', 'Augsta bumba + mīksts SITIENS: griezts, paliek zems pēc stikla.'],
  s_smash: ['SMASH', 'СМЭШ', 'SMEŠS'], s_smash_d: ['High ball + strong HIT: hammer it down.', 'Высокий мяч + сильный УДАР: бейте вниз.', 'Augsta bumba + stiprs SITIENS: sit lejā.'],
  s_portres: ['POR TRES', 'ПОР ТРЕС', 'POR TRES'], s_portres_d: ['Max-power smash at the net: it kicks out over the fence. Point!', 'Смэш на максимуме у сетки: мяч вылетает за ограждение. Очко!', 'Maksimāls smešs pie tīkla: bumba izlido pār žogu. Punkts!'],
  s_vibora: ['VIBORA', 'ВИБОРА', 'VIBORA'], s_vibora_d: ['Full energy bar: a fast corner shot with side spin. Gives them +30 energy.', 'Полная энергия: быстрый удар в угол с боковым вращением. Сопернику +30.', 'Pilna enerģija: ātrs sitiens stūrī ar sānu rotāciju. Pretiniekam +30.'],
  s_glass: ['BACK GLASS', 'ОТ СТЕКЛА', 'NO STIKLA'], s_glass_d: ['Let it bounce and come off your back glass, then hit: a boosted wall shot.', 'Дайте мячу отскочить от заднего стекла и бейте: усиленный удар.', 'Ļauj bumbai atsisties no stikla un sit: pastiprināts sitiens.'],
  r_1: ['Serve underhand, diagonally into the box.', 'Подача снизу, по диагонали в квадрат.', 'Serve no apakšas, pa diagonāli laukumā.'],
  r_2: ['The ball must bounce before it touches their walls.', 'Мяч должен отскочить от пола раньше, чем коснётся их стен.', 'Bumbai jāatsitas pirms tā skar viņu sienas.'],
  r_3: ['After the bounce, glass is in play. 2nd bounce = point.', 'После отскока стекло в игре. Второй отскок — очко.', 'Pēc atsitiena stikls ir spēlē. 2. atsitiens = punkts.'],
  r_4: ['15 · 30 · 40 · golden point at 40–40.', '15 · 30 · 40 · при 40–40 решающее очко.', '15 · 30 · 40 · zelta punkts pie 40–40.'],
  // daily / cup / online / practice / player
  d_daily: ['DAILY', 'НА СЕГОДНЯ', 'ŠODIEN'], d_weekly: ['WEEKLY', 'НА НЕДЕЛЮ', 'ŠONEDĒĻ'], d_new: ['NEW IN', 'НОВЫЕ ЧЕРЕЗ', 'JAUNI PĒC'], d_reset: ['RESETS MONDAY', 'СБРОС В ПОНЕДЕЛЬНИК', 'ATJAUNO PIRMDIEN'],
  d_streak: ['STREAK', 'СЕРИЯ', 'SĒRIJA'], d_days: ['DAYS', 'ДН.', 'DIENAS'], d_chest: ['ALL 3 DONE: +100 XP · +50 COINS', 'ВСЕ 3: +100 XP · +50 МОНЕТ', 'VISI 3: +100 XP · +50 MONĒTAS'], d_opened: ['CHEST OPENED · COME BACK TOMORROW', 'СУНДУК ОТКРЫТ · ЖДЁМ ЗАВТРА', 'LĀDE ATVĒRTA · NĀC RĪT'],
  d_note: ['Challenges count in every mode (online: host only). Rewards are added automatically.', 'Задания засчитываются в любом режиме (онлайн — только у хоста). Награды начисляются сами.', 'Uzdevumi skaitās visos režīmos (tiešsaistē — tikai saimniekam). Balvas tiek pieskaitītas automātiski.'],
  c_title: ['WEEKLY CUP', 'КУБОК НЕДЕЛИ', 'NEDĒĻAS KAUSS'], c_info: ['Three knockout rounds, the same for every player this week. Lose once and the run ends; try again any time.', 'Три раунда на вылет, одинаковые для всех на этой неделе. Проиграли — забег окончен, пробуйте снова когда угодно.', 'Trīs izslēgšanas kārtas, vienādas visiem šonedēļ. Zaudē — mēģini vēlreiz jebkurā laikā.'],
  c_best: ['BEST THIS WEEK', 'ЛУЧШЕЕ ЗА НЕДЕЛЮ', 'LABĀKAIS ŠONEDĒĻ'], c_none: ['NOT PLAYED YET', 'ЕЩЁ НЕ ИГРАЛИ', 'VĒL NAV SPĒLĒTS'], c_prize: ['CHAMPION PRIZE', 'ПРИЗ ЧЕМПИОНА', 'ČEMPIONA BALVA'],
  c_play: ['PLAY THE CUP ▸', 'ИГРАТЬ КУБОК ▸', 'SPĒLĒT KAUSU ▸'], c_cont: ['CONTINUE', 'ПРОДОЛЖИТЬ', 'TURPINĀT'], c_you: ['YOU', 'ВЫ', 'TU'],
  n_title: ['ONLINE', 'ОНЛАЙН', 'TIEŠSAISTĒ'], n_play: ['PLAY ONLINE ▸', 'ИГРАТЬ ОНЛАЙН ▸', 'SPĒLĒT TIEŠSAISTĒ ▸'],
  n_ranked: ['RANKED', 'РЕЙТИНГ', 'REITINGS'], n_ranked_d: ['Find a random opponent. Wins move your rating.', 'Случайный соперник. Победы двигают рейтинг.', 'Nejaušs pretinieks. Uzvaras maina reitingu.'],
  n_friends: ['WITH A FRIEND', 'С ДРУГОМ', 'AR DRAUGU'], n_friends_d: ['Host gets a 4-letter code, your friend types it in. Friendly, no rating.', 'Хост получает код из 4 букв, друг вводит его. Без рейтинга.', 'Saimnieks saņem 4 burtu kodu, draugs to ievada. Bez reitinga.'],
  n_2v2: ['2 VS 2 ROOM', 'КОМНАТА 2 НА 2', '2 PRET 2 ISTABA'], n_2v2_d: ['Up to four players; bots fill the empty slots.', 'До четырёх игроков, пустые места займут боты.', 'Līdz četriem spēlētājiem; tukšās vietas aizpilda boti.'],
  n_recent: ['RECENT OPPONENTS', 'НЕДАВНИЕ СОПЕРНИКИ', 'NESENIE PRETINIEKI'], n_norecent: ['No online matches yet.', 'Онлайн-матчей пока не было.', 'Vēl nav tiešsaistes spēļu.'],
  p_done: ['DONE', 'ГОТОВО', 'GATAVS'], p_next: ['NEXT', 'ДАЛЕЕ', 'NĀKAMAIS'], p_start: ['START PRACTICE ▸', 'НАЧАТЬ ТРЕНИРОВКУ ▸', 'SĀKT TRENIŅU ▸'],
  pl_spd: ['SPEED', 'СКОРОСТЬ', 'ĀTRUMS'], pl_pow: ['POWER', 'СИЛА', 'SPĒKS'], pl_acc: ['ACCURACY', 'ТОЧНОСТЬ', 'PRECIZITĀTE'],
  st_allround: ['Good at everything, best at nothing. The safe start.', 'Всё понемногу. Надёжный старт.', 'Labs visā pa druskai. Drošs sākums.'],
  st_speed: ['Reaches every ball. Hits a little softer.', 'Достаёт любой мяч, но бьёт мягче.', 'Aizsniedz katru bumbu, sit nedaudz vājāk.'],
  st_power: ['Big smashes and deep drives. Slower on the feet.', 'Мощные смэши и глубокие драйвы. Медленнее бегает.', 'Spēcīgi smeši un dziļi draivi. Lēnāks kājās.'],
  st_sniper: ['Paints the lines. Needs time to set up.', 'Попадает в линии. Нужна подготовка к удару.', 'Trāpa līnijās. Vajag laiku sagatavoties.'],
  lv: ['LV', 'УР.', 'LĪM.'], rank: ['WORLD RANK', 'МИРОВОЙ РАНГ', 'PASAULES RANGS'], coins: ['COINS', 'МОНЕТЫ', 'MONĒTAS'],
};
const IDX = { en: 0, ru: 1, lv: 2 };
export const t = k => { const e = D[k]; return e ? (e[IDX[OPTS.lang] ?? 0] || e[0]) : k };
let listeners = [];
export function onLang(fn) { listeners.push(fn) }
/** Fills every [data-i18n] element and lets panels redraw themselves. */
export function setLang(l) {
  if (l) OPTS.lang = l;
  document.documentElement.lang = OPTS.lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const f of listeners) f();
}
