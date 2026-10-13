// @ts-nocheck — ported verbatim from the original course.js (content/course-source/course.js):
// the 16-step drum grid, the arrangement grid, the arpeggio keyboard and the chord explorer.
// Changes from the original: each widget binds on astro:page-load (the site navigates without
// reloads), timers stop on navigation, and making sound pauses the music player. Both keyboards
// play Strudel's own piano recordings (the helper below); the original tone plays until they load.
import { pausePlayer } from '../stores/player';

// The keyboard widgets play Strudel's own piano: the recordings behind s("piano"), one every three
// semitones from A0 to C8, the nearest one pitched to the note (as Strudel does). A widget starts
// loading its keyboard's recordings when you point at it or tab into it. A note whose recording
// isn't there yet plays the widget's simple tone at once, so a click is never silent; if the
// recordings can't be loaded (offline, a blocked host, more than 4 seconds), the tone stays.
var piano = (function () {
  var BASE = 'https://strudel.b-cdn.net/piano/';
  var NAMES = ['A0', 'C1', 'Ds1', 'Fs1', 'A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7', 'Fs7', 'A7', 'C8'];
  var PC = { C: 0, Ds: 3, Fs: 6, A: 9 };
  var MIDI = NAMES.map(function (n) { return 12 * (+n.slice(-1) + 1) + PC[n.slice(0, -1)]; });
  var Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  var ready = {}, loading = {}, decoder = null, failed = !(window.fetch && Offline);
  function nearest(m) {
    var best = 0;
    for (var i = 1; i < MIDI.length; i++) if (Math.abs(MIDI[i] - m) < Math.abs(MIDI[best] - m)) best = i;
    return best;
  }
  function load(i) {
    if (failed || ready[i] || loading[i]) return;
    loading[i] = true;
    var done = false;
    var timer = setTimeout(function () { if (!done) failed = true; }, 4000);
    fetch(BASE + NAMES[i] + 'v8.mp3')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (data) {
        // decoded without a live AudioContext, so loading can start before the first click
        decoder = decoder || new Offline(1, 1, 44100);
        return new Promise(function (ok, fail) { decoder.decodeAudioData(data, ok, fail); });
      })
      .then(function (buf) { done = true; clearTimeout(timer); ready[i] = buf; })
      .catch(function () { done = true; clearTimeout(timer); failed = true; });
  }
  // Starts loading the recordings for MIDI notes lo..hi (a widget's whole keyboard).
  function preload(lo, hi) { for (var m = lo; m <= hi; m++) load(nearest(m)); }
  // Plays MIDI note m, `when` seconds from now, for about `len` seconds at volume `vol`,
  // or calls fallback() right away when its recording isn't ready.
  function play(ac, m, when, len, vol, fallback) {
    var i = nearest(m);
    if (!ready[i]) { load(i); fallback(); return; }
    var t = ac.currentTime + when, src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = ready[i];
    src.playbackRate.value = Math.pow(2, (m - MIDI[i]) / 12);
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + len);
    g.gain.linearRampToValueAtTime(0.0001, t + len + 0.3);
    src.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + len + 0.35);
  }
  return { play: play, preload: preload };
})();


const cleanups = [];
document.addEventListener('astro:before-swap', () => { while (cleanups.length) cleanups.pop()(); });
const bindAll = () => { bindGrids(); bindArp(); bindChordExplorer(); bindMiniKeyboards(); };
document.addEventListener('astro:page-load', bindAll);
bindAll(); // this module may first run after a client-side navigation, when page-load has already fired

function once(el) {
  if (!el || el.dataset.bound) return false;
  el.dataset.bound = '1';
  return true;
}

// 16-step drum grid (one cycle)
function steps(el, rows, header, beatMarks) {
  var html = '<span class="lab"></span>';
  for (var i = 1; i <= 16; i++) html += '<span class="h">' + (header ? header(i) : i) + '</span>';
  rows.forEach(function (r) {
    html += '<span class="lab">' + r.label + '</span>';
    for (var i = 1; i <= 16; i++) {
      var on = r.on.indexOf(i) !== -1;
      var beat = beatMarks && (i - 1) % 4 === 0;
      html += '<span class="c' + (on ? ' on' : '') + (on && r.alt ? ' t' : '') + (beat ? ' beat' : '') + '"></span>';
    }
  });
  el.innerHTML = html;
}
function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }

function bindGrids() {
  var dg = document.getElementById('drumgrid');
  if (once(dg)) steps(dg, [
    { label: 'bd <small>kick</small>', on: [1, 5, 9, 13] },
    { label: 'cp <small>clap</small>', on: [5, 13] },
    { label: 'oh <small>open</small>', on: [3, 7, 11, 15] },
    { label: 'hh <small>L3</small>', on: range(1, 16), alt: true }
  ], null, true);

  var ag = document.getElementById('arr');
  if (once(ag)) steps(ag, [
    { label: 'Kick', on: range(1, 16) },
    { label: 'Clap, hats', on: range(3, 16) },
    { label: 'Bass', on: range(5, 16) },
    { label: 'Chords', on: range(9, 16) },
    { label: 'Melody', on: range(13, 16) }
  ], null, false);
}

function bindArp() {
  var fig = document.getElementById('arp-keyboard');
  if (!once(fig)) return;
  var BARS = [{"notes":["c4","e4","g4","c5","e5"],"name":"C"},{"notes":["c4","d4","a4","d5","f5"],"name":"Dm7/C"},{"notes":["b3","d4","g4","d5","f5"],"name":"G7/B"},{"notes":["c4","e4","g4","c5","e5"],"name":"C"},{"notes":["c4","e4","a4","e5","a5"],"name":"Am/C"},{"notes":["c4","d4","f#4","a4","d5"],"name":"D7/C"},{"notes":["b3","d4","g4","d5","g5"],"name":"G/B"},{"notes":["b3","c4","e4","g4","c5"],"name":"Cmaj7/B"}];
  var PAT = [0,1,2,3,4,2,3,4,0,1,2,3,4,2,3,4];
  var STEP_MS = 60 / 66 / 4 * 1000;   // one 16th note at 66 BPM, the same tempo as the code
  function kid(n) { return 'k-' + n.replace('#', 's'); }
  function lab(n) { return n[0].toUpperCase() + (n[1] === '#' ? '♯' : '') + n.slice(-1); }
  function midi(n) { var pc = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[n[0]] + (n[1] === '#' ? 1 : 0); return 12 * (parseInt(n.slice(-1), 10) + 1) + pc; }
  var chips = Array.prototype.slice.call(fig.querySelectorAll('.catchip'));
  var cells = Array.prototype.slice.call(fig.querySelectorAll('.acell'));
  var stopBtn = document.getElementById('arp-stop');
  var soundBox = document.getElementById('arp-sound');
  var bar = 0, timer = null, ac = null;
  function warm() { if (soundBox.checked) piano.preload(59, 81); }
  fig.addEventListener('pointerenter', warm);
  fig.addEventListener('focusin', warm);

  function clearNow() { Array.prototype.forEach.call(fig.querySelectorAll('.now'), function (e) { e.classList.remove('now'); }); }
  function showBar(b) {
    bar = b; clearNow();
    Array.prototype.forEach.call(fig.querySelectorAll('.chord'), function (e) { e.classList.remove('chord'); });
    Array.prototype.forEach.call(fig.querySelectorAll('.bdg'), function (g) { g.setAttribute('hidden', ''); });
    BARS[b].notes.forEach(function (n, i) {
      var k = document.getElementById(kid(n)); if (k) k.classList.add('chord');
      var g = document.getElementById('b-' + kid(n));
      if (g) { g.removeAttribute('hidden'); g.querySelector('text').textContent = i; }
    });
    chips.forEach(function (c, i) { c.classList.toggle('on', i === b); c.setAttribute('aria-pressed', String(i === b)); });
    var row = chips[b].parentNode; row.scrollLeft = chips[b].offsetLeft - row.offsetLeft - 8;
    cells.forEach(function (c, s) { c.querySelector('span').textContent = lab(BARS[b].notes[PAT[s]]); });
  }
  function beep(n) {
    if (!soundBox.checked || !ac) return;
    piano.play(ac, midi(n), 0, 0.6, 0.6, function () { synthBeep(n); });
  }
  function synthBeep(n) {
    try {
      var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (midi(n) - 69) / 12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.5);
    } catch (e) {}
  }
  function lightStep(s) {
    clearNow();
    var n = BARS[bar].notes[PAT[s]];
    cells[s].classList.add('now');
    var k = document.getElementById(kid(n)); if (k) k.classList.add('now');
    var g = document.getElementById('b-' + kid(n)); if (g) g.classList.add('now');
    beep(n);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; clearNow(); stopBtn.hidden = true; }
  function run(allBars) {
    stop();
    if (soundBox.checked) { pausePlayer(); try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (e) { ac = null; } }
    stopBtn.hidden = false;
    var s = 0, b = allBars ? 0 : bar;
    if (allBars) showBar(0);
    timer = setInterval(function () {
      if (s === 16) { if (allBars && b < BARS.length - 1) { b++; showBar(b); s = 0; } else { stop(); return; } }
      lightStep(s); s++;
    }, STEP_MS);
  }
  chips.forEach(function (c, i) { c.addEventListener('click', function () { stop(); showBar(i); }); });
  document.getElementById('arp-step').addEventListener('click', function () { run(false); });
  document.getElementById('arp-all').addEventListener('click', function () { run(true); });
  stopBtn.addEventListener('click', stop);
  cleanups.push(function () { stop(); if (ac) ac.close(); });
}

function bindChordExplorer() {
  var fig = document.getElementById('chord-explorer-fig');
  if (!once(fig)) return;
  var TYPES = [{"key":"major","sym":"","name":"Major","rec":[0,4,7],"sd":"","mood":"bright, happy"},{"key":"minor","sym":"m","name":"Minor","rec":[0,3,7],"sd":"m","mood":"sad, dark"},{"key":"dim","sym":"dim","name":"Diminished","rec":[0,3,6],"sd":"o","mood":"tense, unstable"},{"key":"aug","sym":"aug","name":"Augmented","rec":[0,4,8],"sd":"aug","mood":"floating, strange"},{"key":"sus2","sym":"sus2","name":"Sus2","rec":[0,2,7],"sd":"2","mood":"open, neither major nor minor"},{"key":"sus4","sym":"sus4","name":"Sus4","rec":[0,5,7],"sd":"sus","mood":"open, wants to move to major"},{"key":"five","sym":"5","name":"Power chord","rec":[0,7],"sd":"5","mood":"hard and plain: rock guitar"},{"key":"dom7","sym":"7","name":"Dominant 7","rec":[0,4,7,10],"sd":"7","mood":"bluesy, wants to resolve"},{"key":"maj7","sym":"maj7","name":"Maj7","rec":[0,4,7,11],"sd":"^7","mood":"soft, jazzy, dreamy"},{"key":"m7","sym":"m7","name":"Minor 7","rec":[0,3,7,10],"sd":"m7","mood":"mellow: house, soul"},{"key":"m7b5","sym":"m7♭5","name":"Half-diminished","rec":[0,3,6,10],"sd":"m7b5","mood":"dark, jazzy: often leads to a minor chord"},{"key":"dim7","sym":"dim7","name":"Dim7","rec":[0,3,6,9],"sd":"o7","mood":"spooky, very tense","deg":[0,2,4,6]},{"key":"7sus4","sym":"7sus4","name":"7sus4","rec":[0,5,7,10],"sd":"7sus","mood":"soft tension: gospel, neo-soul"},{"key":"six","sym":"6","name":"Sixth","rec":[0,4,7,9],"sd":"6","mood":"sweet, old-fashioned"},{"key":"m6","sym":"m6","name":"Minor 6","rec":[0,3,7,9],"sd":"m6","mood":"mysterious: spy films"},{"key":"add9","sym":"add9","name":"Add9","rec":[0,4,7,14],"sd":"add9","mood":"major with a sparkle"},{"key":"nine","sym":"9","name":"Ninth","rec":[0,4,7,10,14],"sd":"9","mood":"funky, bluesy"},{"key":"m9","sym":"m9","name":"Minor 9","rec":[0,3,7,10,14],"sd":"m9","mood":"lush minor: lo-fi, neo-soul"},{"key":"maj9","sym":"maj9","name":"Maj9","rec":[0,4,7,11,14],"sd":"^9","mood":"dreamy, floating"}];
  var ROOTS = ["c","db","d","eb","e","f","f#","g","ab","a","bb","b"];
  var NAMES = ["C","D♭","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
  var FLAT = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
  var SHARP = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  var ti = 0, ri = 0, ac = null, tour = null;
  var typeBtns = Array.prototype.slice.call(fig.querySelectorAll('.cx-type'));
  var rootBtns = Array.prototype.slice.call(fig.querySelectorAll('.cx-root'));
  var sound = document.getElementById('cx-sound');
  function warm() { if (sound.checked) piano.preload(60, 88); }
  fig.addEventListener('pointerenter', warm);
  fig.addEventListener('focusin', warm);

  // spell each note by its letter: a 3rd is always 2 letters up from the root, a 5th 4 letters, a 7th 6 letters
  var LETTERS = 'cdefgab', NAT = [0, 2, 4, 5, 7, 9, 11];
  var STEPS = { 0: 0, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 4, 9: 5, 10: 6, 11: 6, 14: 1 };   // 9 = a 6th, 14 = a 9th (a 2nd an octave up)
  function spell(m, step, rootName) {
    var li = (LETTERS.indexOf(rootName[0]) + step) % 7;
    var acc = ((m - NAT[li]) % 12 + 18) % 12 - 6;    // -1 = flat, +1 = sharp
    if (acc < -1 || acc > 1) {                        // a double flat/sharp: use the simpler name of the same key
      var n = (rootName.indexOf('b') > 0 ? FLAT : SHARP)[m % 12];
      return n + (Math.floor(m / 12) - 1);
    }
    return LETTERS[li] + (acc === 1 ? '#' : acc === -1 ? 'b' : '') + (Math.floor((m - acc) / 12) - 1);
  }
  function pretty(n) { return (n[0].toUpperCase() + n.slice(1)).replace('#', '♯').replace(/^(.)b/, '$1♭'); }
  function midis() { var r = 60 + ri; return TYPES[ti].rec.map(function (s) { return r + s; }); }

  function render() {
    var t = TYPES[ti], root = ROOTS[ri], ms = midis();
    Array.prototype.forEach.call(fig.querySelectorAll('.cx-kbd .chord'), function (e) { e.classList.remove('chord'); });
    Array.prototype.forEach.call(fig.querySelectorAll('.cx-kbd .ctag'), function (g) { g.setAttribute('hidden', ''); });
    ms.forEach(function (m, i) {
      var k = document.getElementById('cx-' + m); if (k) k.classList.add('chord');
      var g = document.getElementById('cxt-' + m);
      if (g) { g.removeAttribute('hidden'); g.querySelector('text').textContent = i === 0 ? '0' : '+' + t.rec[i]; }
    });
    var names = ms.map(function (m, i) { return spell(m, t.deg ? t.deg[i] : STEPS[t.rec[i]], root); });
    typeBtns.forEach(function (b, i) { b.classList.toggle('on', i === ti); b.setAttribute('aria-pressed', String(i === ti)); });
    rootBtns.forEach(function (b, i) { b.classList.toggle('on', i === ri); b.setAttribute('aria-pressed', String(i === ri)); });
    document.getElementById('cx-title').textContent = NAMES[ri] + t.sym + (t.sym === t.name.toLowerCase() ? '' : ' (' + t.name.toLowerCase() + ')');
    document.getElementById('cx-mood').textContent = t.mood;
    document.getElementById('cx-notes').textContent = names.map(pretty).join(' · ');
    document.getElementById('cx-strudel').textContent = 'note("[' + names.join(',') + ']").s("piano")';
    // chord() names come from iReal Pro: sus2 = 2, sus4 = sus, maj7 = ^7, dim = o
    document.getElementById('cx-chord').textContent = 'chord("' + root[0].toUpperCase() + root.slice(1) + t.sd + '").voicing().s("piano")';
  }

  function ctx() {
    if (!sound.checked) return null;
    pausePlayer();
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (e) { ac = null; }
    return ac;
  }
  function tone(m, when, len, vol) {
    var a = ctx(); if (!a) return;
    piano.play(a, m, when, len, vol || 0.6, function () { synth(a, m, when, len); });
  }
  // the fallback: a simple piano-like tone, three harmonics with a fast attack and a long decay
  function synth(a, m, when, len) {
    var f = 440 * Math.pow(2, (m - 69) / 12), t = a.currentTime + when;
    var out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.16, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + len);
    out.connect(a.destination);
    [[1, 1], [2, 0.35], [3, 0.12]].forEach(function (p) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f * p[0]; g.gain.value = p[1];
      o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
    });
  }
  function flash(m, when, len) {
    setTimeout(function () {
      var k = document.getElementById('cx-' + m); if (!k) return;
      k.classList.add('now'); setTimeout(function () { k.classList.remove('now'); }, len * 1000);
    }, when * 1000);
  }
  function playChord(delay) {
    delay = delay || 0;
    var ms = midis();
    // quieter per note when several sound together
    ms.forEach(function (m, i) { tone(m, delay + i * 0.012, 2.2, 0.9 / Math.sqrt(ms.length)); flash(m, delay, 0.6); });
  }
  function playArp() {
    var ms = midis();
    ms.forEach(function (m, i) { tone(m, i * 0.32, 1.2); flash(m, i * 0.32, 0.3); });
    playChord(ms.length * 0.32 + 0.1);
  }
  function stopTour() { if (tour) { clearInterval(tour); tour = null; } }

  typeBtns.forEach(function (b, i) { b.addEventListener('click', function () { stopTour(); ti = i; render(); playChord(); }); });
  rootBtns.forEach(function (b, i) { b.addEventListener('click', function () { stopTour(); ri = i; render(); playChord(); }); });
  Array.prototype.forEach.call(fig.querySelectorAll('.cx-kbd [data-midi]'), function (k) {
    k.addEventListener('click', function () { var m = +k.getAttribute('data-midi'); tone(m, 0, 1.4); flash(m, 0, 0.3); });
  });
  document.getElementById('cx-play').addEventListener('click', function () { stopTour(); playChord(); });
  document.getElementById('cx-arp').addEventListener('click', function () { stopTour(); playArp(); });
  document.getElementById('cx-tour').addEventListener('click', function () {
    stopTour(); ti = 0; render(); playChord();
    tour = setInterval(function () {
      if (ti >= TYPES.length - 1) { stopTour(); return; }
      ti++; render(); playChord();
    }, 1500);
  });
  render();
  cleanups.push(function () { stopTour(); if (ac) ac.close(); });
}

// Small keyboard pictures (svg.kbd-mini[data-notes]): click one, or press Enter/Space on it, to hear
// its chord on the piano; its lit keys flash while it sounds (course.js, the same behaviour).
function bindMiniKeyboards() {
  var pics = Array.prototype.slice.call(document.querySelectorAll('.lesson-body svg.kbd-mini[data-notes]')).filter(once);
  if (!pics.length) return;
  var ac = null;
  function ctx() {
    pausePlayer();
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (e) { ac = null; }
    return ac;
  }
  // the fallback while the piano loads: a simple piano-like tone
  function synth(a, m, when, len) {
    var f = 440 * Math.pow(2, (m - 69) / 12), t = a.currentTime + when, out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.16, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + len);
    out.connect(a.destination);
    [[1, 1], [2, 0.35], [3, 0.12]].forEach(function (p) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f * p[0]; g.gain.value = p[1];
      o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
    });
  }
  function notes(svg) { return svg.getAttribute('data-notes').split(' ').map(Number); }
  function playPic(svg) {
    var a = ctx(); if (!a) return;
    var ms = notes(svg), vol = 0.9 / Math.sqrt(ms.length);
    ms.forEach(function (m, i) {
      piano.play(a, m, i * 0.012, 2.2, vol, function () { synth(a, m, i * 0.012, 2.2); });
    });
    var lit = Array.prototype.slice.call(svg.querySelectorAll('.chord'));
    lit.forEach(function (k) { k.classList.add('now'); });
    setTimeout(function () { lit.forEach(function (k) { k.classList.remove('now'); }); }, 600);
  }
  pics.forEach(function (svg) {
    var ms = notes(svg);
    svg.setAttribute('role', 'button');
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-label', svg.getAttribute('aria-label') + ' Play it.');
    var warm = function () { piano.preload(ms[0], ms[ms.length - 1]); };
    svg.addEventListener('pointerenter', warm);
    svg.addEventListener('focus', warm);
    svg.addEventListener('click', function () { playPic(svg); });
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playPic(svg); }
    });
  });
  cleanups.push(function () { if (ac) ac.close(); });
}
