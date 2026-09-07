/* Fretboard Theory — intervals, chord construction, and what the numbers mean. */

/* ---------- theory constants ---------- */

const SHARP = ['C','C\u266F','D','D\u266F','E','F','F\u266F','G','G\u266F','A','A\u266F','B'];
const FLAT  = ['C','D\u266D','D','E\u266D','E','F','G\u266D','G','A\u266D','A','B\u266D','B'];

const FLAT_KEYS = [5,10,3,8,1,6];

const IVL_SHORT = ['R','\u266D2','2','\u266D3','3','4','\u266D5','5','\u266D6','6','\u266D7','7'];
const IVL_LONG  = ['Root','Minor 2nd','Major 2nd','Minor 3rd','Major 3rd',
                   'Perfect 4th','Tritone','Perfect 5th','Minor 6th',
                   'Major 6th','Minor 7th','Major 7th'];

const MAJOR = [0,2,4,5,7,9,11];
const ROMAN = ['I','ii','iii','IV','V','vi','vii\u00B0'];
const TRIAD_SUFFIX = ['','m','m','','','m','dim'];
const SEV_SUFFIX   = ['maj7','m7','m7','maj7','7','m7','m7\u266D5'];
const QUALITY = ['major','minor','minor','major','major','minor','diminished'];

const STRINGS = [40,45,50,55,59,64];
const STRING_LABEL = ['E','A','D','G','B','e'];
const FRETS = 12;
const MARKERS = [3,5,7,9,12];

const PROGRESSIONS = [
  { name:'I \u2013 V \u2013 vi \u2013 IV', degrees:[0,4,5,3],
    blurb:'The one you have heard ten thousand times. It leaves home, gets tense on the V, drops to the relative minor, then walks back up.' },
  { name:'ii \u2013 V \u2013 I', degrees:[1,4,0],
    blurb:'The backbone of jazz. Each root moves down a fifth, which is the strongest pull in tonal music. Try it with sevenths.' },
  { name:'I \u2013 IV \u2013 V', degrees:[0,3,4],
    blurb:'Blues, folk, early rock. Three major chords, all drawn from one scale.' },
  { name:'vi \u2013 IV \u2013 I \u2013 V', degrees:[5,3,0,4],
    blurb:'Same four chords as I\u2013V\u2013vi\u2013IV, started in a different place. Beginning on the minor makes the whole thing read as sadder.' },
  { name:'I \u2013 vi \u2013 IV \u2013 V', degrees:[0,5,3,4],
    blurb:'The doo-wop turnaround. Fifties pop lives here.' },
  { name:'I \u2013 iii \u2013 IV \u2013 V', degrees:[0,2,3,4],
    blurb:'The iii is a gentle substitute for the I \u2014 they share two of three notes, so it lifts without really leaving.' }
];

/* ---------- helpers ---------- */

const pc = n => ((n % 12) + 12) % 12;

function noteName(p, key){
  return (FLAT_KEYS.indexOf(key) !== -1 ? FLAT : SHARP)[pc(p)];
}

function scaleOf(root){
  return MAJOR.map(i => pc(root + i));
}

function chordTones(root, degree, size){
  const s = scaleOf(root);
  const out = [];
  for (let i = 0; i < size; i++) out.push(s[(degree + i*2) % 7]);
  return out;
}

function chordName(root, degree, size, key){
  const s = scaleOf(root);
  const suffix = size === 4 ? SEV_SUFFIX[degree] : TRIAD_SUFFIX[degree];
  return noteName(s[degree], key) + suffix;
}

/* ---------- audio ---------- */

let actx = null;

function ensureAudio(){
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function playMidi(midi, delay, dur){
  delay = delay || 0;
  dur = dur || 0.8;
  const ctx = ensureAudio();
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.20, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function playChordTones(tones, delay){
  delay = delay || 0;
  let last = 47;
  tones.forEach((p, i) => {
    let m = 48 + p;
    while (m <= last) m += 12;
    last = m;
    playMidi(m, delay + i * 0.055, 1.5);
  });
}

/* ---------- fretboard rendering ---------- */

function renderBoard(host, opts){
  const table = document.createElement('table');
  table.className = 'board';

  const head = document.createElement('tr');
  head.appendChild(document.createElement('th'));
  for (let f = 0; f <= FRETS; f++){
    const th = document.createElement('th');
    th.textContent = f === 0 ? '' : f;
    if (MARKERS.indexOf(f) !== -1) th.className = 'marked';
    head.appendChild(th);
  }
  table.appendChild(head);

  for (let s = STRINGS.length - 1; s >= 0; s--){
    const tr = document.createElement('tr');

    const lab = document.createElement('td');
    lab.className = 'strlabel';
    lab.textContent = STRING_LABEL[s];
    tr.appendChild(lab);

    for (let f = 0; f <= FRETS; f++){
      const td = document.createElement('td');
      td.className = 'cell' + (f === 0 ? ' nut' : '');

      const midi = STRINGS[s] + f;
      const p = pc(midi);
      const key = 's' + s + '-' + f;
      const forced = opts.marks && opts.marks[key];
      const show = forced || !opts.visible || opts.visible.indexOf(p) !== -1;

      if (show){
        const dot = document.createElement('span');
        dot.className = 'dot';

        if (forced){
          dot.className += ' ' + forced;
        } else {
          const iv = pc(p - opts.root);
          if (iv === 0) dot.className += ' r';
          else if (iv === 3 || iv === 4) dot.className += ' t';
          else if (iv === 7) dot.className += ' f';
        }

        dot.textContent = opts.label ? opts.label(p, forced) : '';
        td.appendChild(dot);
      }

      td.addEventListener('click', () => {
        playMidi(midi);
        if (opts.onTap) opts.onTap(s, f, midi, p);
      });

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  host.innerHTML = '';
  host.appendChild(table);
}

function fillNoteSelect(sel, initial){
  SHARP.forEach((n, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = n;
    sel.appendChild(o);
  });
  sel.value = initial;
}

/* ---------- EXPLORE ---------- */

const exRoot  = document.getElementById('ex-root');
const exMode  = document.getElementById('ex-mode');
const exScale = document.getElementById('ex-scaleonly');
const exBoard = document.getElementById('ex-board');
const exOut   = document.getElementById('ex-readout');

fillNoteSelect(exRoot, 7);

function drawExplore(){
  const root = +exRoot.value;
  const mode = exMode.value;
  const scale = scaleOf(root);
  const visible = exScale.checked ? scale : null;

  renderBoard(exBoard, {
    root: root,
    visible: visible,
    label: p => {
      if (mode === 'notes') return noteName(p, root);
      if (mode === 'degrees'){
        const d = scale.indexOf(p);
        return d === -1 ? '' : String(d + 1);
      }
      return IVL_SHORT[pc(p - root)];
    },
    onTap: (s, f, midi, p) => {
      const iv = pc(p - root);
      const d = scale.indexOf(p);
      let msg = '<b>' + noteName(p, root) + '</b> \u2014 ' + IVL_LONG[iv] +
                ' above ' + noteName(root, root) +
                ' (' + iv + ' semitone' + (iv === 1 ? '' : 's') + ')';
      if (d !== -1) msg += '. Scale degree <b>' + (d + 1) + '</b> of ' +
                           noteName(root, root) + ' major.';
      else msg += '. Outside the ' + noteName(root, root) + ' major scale.';
      exOut.innerHTML = msg;
    }
  });
}

exRoot.addEventListener('change', drawExplore);
exMode.addEventListener('change', drawExplore);
exScale.addEventListener('change', drawExplore);

/* ---------- CHORDS ---------- */

const chKey   = document.getElementById('ch-key');
const chSize  = document.getElementById('ch-size');
const chList  = document.getElementById('ch-list');
const chBoard = document.getElementById('ch-board');
const chOut   = document.getElementById('ch-readout');

let chSelected = 0;

fillNoteSelect(chKey, 7);

function drawChords(){
  const key = +chKey.value;
  const size = +chSize.value;

  chList.innerHTML = '';
  for (let d = 0; d < 7; d++){
    const tones = chordTones(key, d, size);
    const btn = document.createElement('div');
    btn.className = 'chordbtn' + (d === chSelected ? ' on' : '');
    btn.innerHTML =
      '<div class="num">' + ROMAN[d] + '</div>' +
      '<div class="nm">' + chordName(key, d, size, key) + '</div>' +
      '<div class="tones">' + tones.map(t => noteName(t, key)).join(' ') + '</div>';
    btn.addEventListener('click', () => {
      chSelected = d;
      playChordTones(tones);
      drawChords();
    });
    chList.appendChild(btn);
  }

  const d = chSelected;
  const tones = chordTones(key, d, size);
  const scale = scaleOf(key);
  const chordRoot = scale[d];

  renderBoard(chBoard, {
    root: chordRoot,
    visible: tones,
    label: p => IVL_SHORT[pc(p - chordRoot)]
  });

  const degreeNums = tones.map(t => scale.indexOf(t) + 1).join('-');
  chOut.innerHTML =
    '<b>' + ROMAN[d] + '</b> in ' + noteName(key, key) + ' major is <b>' +
    chordName(key, d, size, key) + '</b>. It is built on scale degree <b>' +
    (d + 1) + '</b>, stacking scale degrees ' + degreeNums +
    '. The scale makes it <b>' + QUALITY[d] + '</b>' +
    (size === 4 && d === 4 ? ' \u2014 and adding the 7th makes it dominant, which is what gives V its pull back to I' : '') +
    '.';
}

chKey.addEventListener('change', drawChords);
chSize.addEventListener('change', drawChords);

/* ---------- NUMBERS ---------- */

const prKey    = document.getElementById('pr-key');
const prPreset = document.getElementById('pr-preset');
const prCards  = document.getElementById('pr-cards');
const prPlay   = document.getElementById('pr-play');
const prExpl   = document.getElementById('pr-explain');

fillNoteSelect(prKey, 7);

PROGRESSIONS.forEach((p, i) => {
  const o = document.createElement('option');
  o.value = i;
  o.textContent = p.name;
  prPreset.appendChild(o);
});

function drawProg(){
  const key = +prKey.value;
  const prog = PROGRESSIONS[+prPreset.value];

  prCards.innerHTML = '';
  prog.degrees.forEach(d => {
    const tones = chordTones(key, d, 3);
    const card = document.createElement('div');
    card.className = 'progcard';
    card.innerHTML =
      '<div class="num">' + ROMAN[d] + '</div>' +
      '<div class="nm">' + chordName(key, d, 3, key) + '</div>' +
      '<div class="tones">' + tones.map(t => noteName(t, key)).join(' ') + '</div>';
    card.addEventListener('click', () => {
      playChordTones(tones);
      [].forEach.call(prCards.children, c => c.classList.remove('lit'));
      card.classList.add('lit');
    });
    prCards.appendChild(card);
  });

  const names = prog.degrees.map(d => chordName(key, d, 3, key)).join(' \u2192 ');
  prExpl.innerHTML =
    '<h3>' + prog.name + ' in ' + noteName(key, key) + '</h3>' +
    '<p><b>' + names + '</b></p>' +
    '<p>' + prog.blurb + '</p>';
}

prPlay.addEventListener('click', () => {
  const key = +prKey.value;
  const prog = PROGRESSIONS[+prPreset.value];
  prog.degrees.forEach((d, i) => {
    playChordTones(chordTones(key, d, 3), i * 1.1);
    setTimeout(() => {
      [].forEach.call(prCards.children, c => c.classList.remove('lit'));
      if (prCards.children[i]) prCards.children[i].classList.add('lit');
    }, i * 1100);
  });
});

prKey.addEventListener('change', drawProg);
prPreset.addEventListener('change', drawProg);

/* ---------- TRAIN ---------- */

const trBoard   = document.getElementById('tr-board');
const trChoices = document.getElementById('tr-choices');
const trOut     = document.getElementById('tr-feedback');
const trScoreEl = document.getElementById('tr-score');
const trSkip    = document.getElementById('tr-skip');

let trRight = 0, trTotal = 0, trAnswer = null;

function newQuestion(){
  trAnswer = null;
  trOut.textContent = '';
  trOut.className = 'readout';

  const s1 = Math.floor(Math.random() * 4);
  const f1 = Math.floor(Math.random() * 8);
  const rootMidi = STRINGS[s1] + f1;

  let s2, f2, targetMidi, semis, guard = 0;
  do {
    s2 = s1 + (Math.random() < 0.55 ? 1 : 0);
    if (s2 > 5) s2 = s1;
    f2 = f1 + Math.floor(Math.random() * 7) - 2;
    if (f2 < 0) f2 = 0;
    if (f2 > FRETS) f2 = FRETS;
    targetMidi = STRINGS[s2] + f2;
    semis = targetMidi - rootMidi;
    guard++;
  } while ((semis <= 0 || semis > 12) && guard < 60);

  if (semis <= 0 || semis > 12){
    s2 = s1; f2 = f1 + 5; targetMidi = STRINGS[s2] + f2; semis = 5;
  }

  const marks = {};
  marks['s' + s1 + '-' + f1] = 'r';
  marks['s' + s2 + '-' + f2] = 'q';

  renderBoard(trBoard, {
    root: pc(rootMidi),
    visible: [],
    label: (p, forced) => forced === 'r' ? 'R' : '?',
    marks: marks
  });

  trAnswer = semis;

  const pool = new Set([semis]);
  while (pool.size < 4) pool.add(1 + Math.floor(Math.random() * 12));
  const choices = [...pool].sort(() => Math.random() - 0.5);

  trChoices.innerHTML = '';
  choices.forEach(c => {
    const b = document.createElement('button');
    b.textContent = c === 12 ? 'Octave' : IVL_LONG[c % 12];
    b.addEventListener('click', () => answer(b, c, rootMidi, targetMidi));
    trChoices.appendChild(b);
  });
}

function answer(btn, choice, rootMidi, targetMidi){
  if (btn.disabled) return;
  trTotal++;
  [].forEach.call(trChoices.children, b => b.disabled = true);

  playMidi(rootMidi, 0, 0.7);
  playMidi(targetMidi, 0.45, 0.9);

  const label = trAnswer === 12 ? 'Octave' : IVL_LONG[trAnswer % 12];

  if (choice === trAnswer){
    trRight++;
    btn.className = 'right';
    trOut.className = 'readout good';
    trOut.innerHTML = 'Correct \u2014 <b>' + label + '</b>, ' + trAnswer + ' semitones.';
  } else {
    btn.className = 'wrong';
    [].forEach.call(trChoices.children, b => {
      if (b.textContent === label) b.className = 'right';
    });
    trOut.className = 'readout bad';
    trOut.innerHTML = 'That was <b>' + label + '</b> \u2014 ' + trAnswer + ' semitones.';
  }

  trScoreEl.textContent = trRight + ' / ' + trTotal;
  setTimeout(newQuestion, 1900);
}

trSkip.addEventListener('click', newQuestion);

/* ---------- boot ---------- */

document.querySelectorAll('#tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('on'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById(btn.dataset.tab).classList.add('on');
  });
});

drawExplore();
drawChords();
drawProg();
newQuestion();

if ('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
