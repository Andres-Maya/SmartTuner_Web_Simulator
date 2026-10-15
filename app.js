'use strict';

/*
 * SmartTuner — mockup interactivo.
 * Las funciones de dibujo son traducciones directas de los Canvas de la app
 * (LedTuningArc.kt, SevenSegment.kt, NoteStrip.kt, StaffNotation.kt) y los estados
 * siguen TunerViewModel / StringTuningTracker. El "micrófono" es el panel simulador.
 */
(() => {
  // ================================================================= datos (Instrument.kt)
  // Tipos (cuántas cuerdas) y, en cada uno, sus afinaciones: la estándar primero.
  const INSTRUMENTS = [
    { id: 'GUITAR', name: 'Guitarra', icon: 'guitar', types: [
      [6, [
        ['Estándar', [64, 59, 55, 50, 45, 40]],
        ['Drop D', [64, 59, 55, 50, 45, 38]],
        ['Medio tono abajo', [63, 58, 54, 49, 44, 39]],
        ['Un tono abajo', [62, 57, 53, 48, 43, 38]],
        ['Drop C', [62, 57, 53, 48, 43, 36]],
        ['DADGAD', [62, 57, 55, 50, 45, 38]],
        ['Open G', [62, 59, 55, 50, 43, 38]],
        ['Open D', [62, 57, 54, 50, 45, 38]],
      ]],
      [7, [['Estándar', [64, 59, 55, 50, 45, 40, 35]], ['Drop A', [64, 59, 55, 50, 45, 40, 33]]]],
      [8, [['Estándar', [64, 59, 55, 50, 45, 40, 35, 30]], ['Drop E', [64, 59, 55, 50, 45, 40, 35, 28]]]],
    ] },
    { id: 'BASS', name: 'Bajo', icon: 'bass', types: [
      [4, [
        ['Estándar', [43, 38, 33, 28]],
        ['Drop D', [43, 38, 33, 26]],
        ['Medio tono abajo', [42, 37, 32, 27]],
      ]],
      [5, [['Estándar', [43, 38, 33, 28, 23]]]],
      [6, [['Estándar', [48, 43, 38, 33, 28, 23]]]],
    ] },
    { id: 'VIOLIN', name: 'Violín', icon: 'violin', types: [[4, [['Estándar', [76, 69, 62, 55]]]]] },
    { id: 'VIOLA', name: 'Viola', icon: 'violin', types: [
      [4, [['Estándar', [69, 62, 55, 48]]]],
      [5, [['Estándar', [76, 69, 62, 55, 48]]]],
    ] },
    { id: 'CELLO', name: 'Violonchelo', icon: 'cello', types: [
      [4, [['Estándar', [57, 50, 43, 36]]]],
      [5, [['Estándar', [64, 57, 50, 43, 36]]]],
    ] },
    { id: 'UKULELE', name: 'Ukelele', icon: 'ukulele', types: [
      [4, [
        ['Estándar · GCEA', [69, 64, 60, 67]],
        ['Sol grave · GCEA', [69, 64, 60, 55]],
        ['Barítono · DGBE', [62, 59, 55, 50]],
        ['Re · ADF♯B', [71, 66, 62, 69]],
      ]],
    ] },
  ].map((inst) => ({
    ...inst,
    types: inst.types.map(([count, tunings], ti) => ({
      name: `${count} cuerdas`,
      count,
      tunings: tunings.map(([name, midis], i) => ({
        name,
        key: `std:${ti}:${i}`,
        strings: midis.map((midi, n) => ({ number: n + 1, midi })),
      })),
    })),
  }));
  const instrumentById = (id) => INSTRUMENTS.find((i) => i.id === id);

  // Iconos de línea del paquete (guitar.svg, bass.svg, violin.svg, cello.svg, ukulele.svg).
  const LINE_ICONS = {
    guitar: ['0 0 32 32', 'M30.9,4.5l-3-3c-0.4-0.4-1-0.4-1.4,0l-3.8,3.8c-0.2,0.2-0.3,0.4-0.3,0.7v1.1l-4.3,4.3c-2.5-1.3-5.5-0.9-7.5,1c-0.5,0.5-0.9,1.1-1.2,1.8c-0.3,0.6-0.8,0.9-1.5,1c-0.7,0-1.5,0.1-2.3,0.4c-2.2,0.9-3.7,2.7-4.2,5c-0.5,2.7,0.4,5.7,2.6,7.8c1.8,1.8,4.1,2.7,6.3,2.7c0.5,0,1,0,1.5-0.1c2.3-0.5,4.1-2,5-4.2c0.3-0.8,0.4-1.6,0.4-2.4c0-0.6,0.4-1.2,1-1.4c0.1,0,0.3-0.1,1-0.4c1.1-0.3,1.9-1.2,2.300-2.3c0.4-1.1-0.1-2.3-1-2.8c0,0,0,0,0,0c-0.7-0.4-1.1-1.1-1.1-1.9l0-0.3l-4.7,4.7c-0.4,0.4-1,0.4-1.4,0c-0.2-0.2-0.3-0.5-0.3-0.8l9.6-9.6c0.2,0.2,0.4,0.4,0.7,0.4h3c0.3,0,0.5-0.1,0.7-0.3l3.8-3.8C31.3,5.5,31.3,4.9,30.9,4.5z M10.7,26.1c-0.2,0.2-0.5,0.3-0.7,0.3s-0.5-0.1-0.7-0.3l-3-3c-0.4-0.4-0.4-1,0-1.4c0.4-0.4,1-0.4,1.4,0l3,3C11.1,25.1,11.1,25.7,10.7,26.1z'],
    bass: ['0 0 66.208 66.208', 'M65.51,1.579c-0.637-0.153-1.202-0.419-1.641-0.675c-0.596-0.348-1.345-0.235-1.85,0.236c-1.782,1.66-3.946,2.753-5.529,3.408c-0.719,0.298-1.161,1.058-0.996,1.818c0.263,1.212-0.708,2.259-1.054,2.587l-0.126,0.116l0,0l-30.11,27.876c-0.268,0.25-1.043,0.866-1.866,0.043c-1.038-1.038-1.224-4.378,3.486-9.089c0-0.062,1.266-0.809,0.457-1.619c-0.809-0.809-3.175,0.353-4.773,1.951c-4.71,4.711-4.677,8.106-7.097,10.459c-2.967,2.884-8.28,2.386-11.994,6.101c0,0-6.911,6.01,2.634,15.555c7.167,7.167,11.373,5.729,14.582,2.519c4.234-4.234,2.238-8.29,3.586-9.638c2.269-2.27,4.657-1.763,6.956-4.611c1.273-1.577,0.131-3.05-1.005-1.914c-0.939,0.939-3.422,2.135-4.75,0.807c-1.106-1.106-0.712-2.557,1.934-5.496l30.095-30.095c1.256-1.256,2.5-1.67,3.41-1.776c0.827-0.097,1.507-0.638,1.828-1.407c0.855-2.046,2.778-4.161,4.231-5.567C66.444,2.66,66.221,1.749,65.51,1.579z M15.874,56.741c-0.587,0.587-1.54,0.587-2.127,0l-5.64-5.64c-0.587-0.587-0.587-1.54,0-2.127c0.587-0.587,1.54-0.587,2.127,0l5.64,5.64C16.462,55.201,16.462,56.154,15.874,56.741z'],
    violin: ['0 0 467.46 467.46', 'M459.035,0l-4.877,4.246l-3.495-3.502L447.104,4.3l-3.811-3.805l-6.652,6.652l3.803,3.811l-3.551,3.557l2.569,2.564L398.07,50.984l1.871,1.871l-99.312,93.521c-33.854-26.848-77.167-30.122-101.416-5.873c-8.668,8.66-16.932,22.947-23.019,39.434c-5.328,3.821-11.625,7.229-17.38,7.447c0,0,22.193,20.694-11.469,48.37c-33.663,27.691-50.368,11.974-57.851,2.997c0,0-1.252,9.654-9.363,20.738c-22.658,4.693-44.803,14.139-58.956,30.128c-38.397,43.393-14.963,98.743,18.446,132.153c40.972,40.972,93.257,66.331,136.144,23.443c14.938-14.932,25.011-36.199,29.499-59.029c11.447-8.7,21.62-10.034,21.62-10.034c-8.975-7.482-24.682-24.189,2.993-57.852c27.676-33.662,48.366-11.47,48.366-11.47c0.208-5.594,3.442-11.705,7.137-16.935c16.723-6.104,31.234-14.451,39.998-23.207c24.249-24.249,20.975-67.565-5.875-101.417l93.546-99.346l1.839,1.837l34.079-41.15l2.4,2.392l3.555-3.559l3.804,3.811l6.664-6.674l-3.812-3.805l3.559-3.559l-3.266-3.264l4.268-4.853L459.035,0z'],
    cello: ['0 0 63.246 63.246', 'M62.048,1.235c-1.664-1.664-4.441-1.584-6.203,0.179c-0.825,0.825-1.266,1.873-1.347,2.924l-1.694-1.694c-0.391-0.391-1.023-0.391-1.414,0s-0.391,1.023,0,1.414l1.813,1.813c0.136,0.136,0.304,0.207,0.478,0.248l-1.705,1.423c-0.047-0.095-0.099-0.188-0.177-0.267l-1.813-1.813c-0.391-0.391-1.023-0.391-1.414,0c-0.391,0.39-0.391,1.023,0,1.414l1.813,1.813c0.036,0.036,0.082,0.051,0.121,0.08l-11.836,9.878c-9.999-6.647-17.61,3.387-17.61,3.387s-1.238,0.472-2.91,0.664c-1.506,2.297,2.98,2.106,1.787,4.85c-2.55,5.865-8.106,3.629-9.897,2.714c-0.385-0.197-0.826-0.238-1.24-0.115L7.79,30.447c-0.12,0.036-0.193,0.156-0.17,0.278l0.266,1.418c0,0-7.237,1.86-7.811,7.811C-0.41,44.983,1.428,51.62,6.508,56.7s11.717,6.918,16.746,6.433c5.951-0.574,7.811-7.811,7.811-7.811l1.418,0.266c0.123,0.023,0.243-0.05,0.278-0.17l0.299-1.007c0.123-0.414,0.081-0.855-0.115-1.24c-0.914-1.791-3.15-7.348,2.714-9.897c2.744-1.193,2.553,3.293,4.85,1.787c0.191-1.672,0.664-2.91,0.664-2.91s10.034-7.611,3.387-17.61l9.858-11.812c0.003,0.003,0.004,0.008,0.008,0.011l1.813,1.813c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414l-1.813-1.813c-0.048-0.048-0.107-0.071-0.161-0.107l1.351-1.619c0.049,0.117,0.119,0.227,0.214,0.323l1.813,1.813c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414l-1.532-1.532c1.054-0.08,2.105-0.521,2.931-1.348C63.632,5.676,63.712,2.899,62.048,1.235z M17.854,50.832l-1.723,1.723c-1.324,1.324-3.471,1.324-4.795,0L10.5,51.718c-1.324-1.324-1.324-3.471,0-4.795l1.723-1.723c0.835-0.835,2.188-0.835,3.023,0l2.609,2.609C18.689,48.644,18.689,49.997,17.854,50.832z'],
    ukulele: ['0 0 512 512', 'M502.63 39L473 9.37a32 32 0 0 0-45.26 0L381.46 55.7a35.140 35.14 0 0 0-8.53 13.79L360.77 106l-76.26 76.26c-12.16-8.760-25.5-15.74-40.1-19.14-33.45-7.78-67-.88-89.88 22a82.45 82.45 0 0 0-20.24 33.47c-6 18.56-23.21 32.69-42.15 34.46-23.7 2.270-45.730 11.45-62.61 28.44C-16.11 327-7.9 409 47.58 464.45S185 528 230.56 482.52c17-16.88 26.16-38.9 28.45-62.71 1.76-18.85 15.89-36.130 34.43-42.14a82.6 82.6 0 0 0 33.48-20.25c22.87-22.88 29.74-56.36 22-89.75-3.39-14.64-10.37-28-19.16-40.2L406 151.23l36.48-12.16a35.14 35.14 0 0 0 13.79-8.53l46.33-46.32a32 32 0 0 0 .03-45.22zM208 352a48 48 0 1 1 48-48 48 48 0 0 1-48 48z'],
  };
  const lineIcon = (key, cls = 'o-icon') => {
    const [viewBox, d] = LINE_ICONS[key];
    return `<svg class="${cls}" viewBox="${viewBox}" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
  };

  // ================================================================= color (Palette.kt, Tokens.kt)
  const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255, a: 1 });
  const alpha = (c, a) => ({ r: c.r, g: c.g, b: c.b, a });
  const css = (c) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(c.a * 1000) / 1000})`;
  const toHex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // lerp() de Compose mezcla en Oklab.
  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  function toOklab(c) {
    const r = toLinear(c.r), g = toLinear(c.g), b = toLinear(c.b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
  }
  function fromOklab([L, A, B], a) {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
    return {
      r: clamp(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 1),
      g: clamp(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 1),
      b: clamp(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s), 0, 1),
      a,
    };
  }
  function lerpColor(x, y, t) {
    const p = toOklab(x), q = toOklab(y);
    return fromOklab(p.map((v, i) => v + (q[i] - v) * t), x.a + (y.a - x.a) * t);
  }
  const mixRgb = (x, y, t) => ({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t, a: x.a + (y.a - x.a) * t });

  const PALETTE = {
    // Modo oscuro: tinta azulada y el celeste del logo.
    ink950: hex('#05070F'), ink900: hex('#090D1C'), ink800: hex('#131A33'), ink700: hex('#1C2447'),
    mist50: hex('#EDEFF7'), mist400: hex('#8A93B2'),
    sky400: hex('#38BDF8'), cyan400: hex('#22D3EE'),
    mint400: hex('#3DDC97'), amber300: hex('#FFC857'), coral400: hex('#FF6B6B'),
    // Modo claro: papel crema con tinta oscura y un azul sereno para las acciones.
    sand50: hex('#FAF9F4'), sand100: hex('#F1F0EB'), sand200: hex('#E9E6DC'), sand300: hex('#DDD8C9'),
    bark900: hex('#33291A'), clay400: hex('#746A58'),
    azure600: hex('#3F72AF'), azure400: hex('#5B8DC9'),
    moss600: hex('#1F7043'), honey600: hex('#8E6110'), brick600: hex('#B23A32'),
    white: hex('#FFFFFF'),
  };

  // Los dos aspectos de la app (ThemeMode.kt + DarkTunerColors / LightTunerColors).
  const MODES = {
    dark: {
      name: 'oscuro',
      background: PALETTE.ink900, backgroundDeep: PALETTE.ink950,
      surface: PALETTE.ink800, surfaceHigh: PALETTE.ink700,
      textPrimary: PALETTE.mist50, textMuted: PALETTE.mist400,
      accent: PALETTE.sky400, accentAlt: PALETTE.cyan400, onAccent: PALETTE.ink950,
      inTune: PALETTE.mint400, nearlyInTune: PALETTE.amber300, outOfTune: PALETTE.coral400,
      track: alpha(PALETTE.white, 0.10), tick: alpha(PALETTE.white, 0.30), staffLine: alpha(PALETTE.white, 0.40),
      display: PALETTE.ink950, displayFrame: alpha(PALETTE.white, 0.07),
      glow: 1,
    },
    light: {
      name: 'claro',
      background: PALETTE.sand100, backgroundDeep: PALETTE.sand200,
      surface: PALETTE.sand50, surfaceHigh: PALETTE.sand200,
      textPrimary: PALETTE.bark900, textMuted: PALETTE.clay400,
      // Un azul con cuerpo: hace de texto y de trazo sobre el crema, y un pastel ahí no se lee.
      accent: PALETTE.azure600, accentAlt: PALETTE.azure400, onAccent: PALETTE.sand50,
      inTune: PALETTE.moss600, nearlyInTune: PALETTE.honey600, outOfTune: PALETTE.brick600,
      track: alpha(PALETTE.bark900, 0.10), tick: alpha(PALETTE.bark900, 0.26), staffLine: alpha(PALETTE.bark900, 0.35),
      // El "cristal" del visor va un punto más oscuro que el papel, como un LCD apagado.
      display: PALETTE.sand300, displayFrame: alpha(PALETTE.bark900, 0.14),
      glow: 0,
    },
  };

  const IN_TUNE_CENTS = 5;
  function tuningColor(cents, hasSignal, c) {
    if (!hasSignal) return c.textMuted;
    const d = Math.abs(cents);
    if (d <= IN_TUNE_CENTS) return c.inTune;
    if (d <= 20) return lerpColor(c.inTune, c.nearlyInTune, (d - 5) / 15);
    return lerpColor(c.nearlyInTune, c.outOfTune, Math.min((d - 20) / 30, 1));
  }

  // ================================================================= música (MusicTheory.kt, StaffLayout.kt)
  const LETTERS = 'CDEFGAB';
  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const SHARP = [[0, ''], [0, '♯'], [1, ''], [1, '♯'], [2, ''], [3, ''], [3, '♯'], [4, ''], [4, '♯'], [5, ''], [5, '♯'], [6, '']];
  const FLAT = [[0, ''], [1, '♭'], [1, ''], [2, '♭'], [2, ''], [3, ''], [4, '♭'], [4, ''], [5, '♭'], [5, ''], [6, '♭'], [6, '']];
  const mod = (n, m) => ((n % m) + m) % m;

  function noteName(midi, style) {
    const [li, acc] = (style === 'FLATS' ? FLAT : SHARP)[mod(midi, 12)];
    const octave = Math.floor(midi / 12) - 1;
    const letter = LETTERS[li];
    return {
      midi, letter, acc, octave,
      label: `${letter}${acc}${octave}`,
      solfegeLabel: `${SOLFEGE[li]}${acc} ${octave}`,
    };
  }
  const midiToFreq = (midi, a4) => a4 * 2 ** ((midi - 69) / 12);
  const freqToMidi = (f, a4) => 69 + 12 * Math.log2(f / a4);

  const formatHz = (hz) => `${hz.toFixed(1)} Hz`;
  // Como el "%+.0f" de la app: el signo sale de la desviación, no del número ya redondeado.
  const formatCents = (c) => `${c < 0 ? '-' : '+'}${Math.abs(Math.round(c))} ¢`;
  const stringLabels = (tuning, style) => [...tuning.strings].sort((a, b) => a.midi - b.midi).map((s) => noteName(s.midi, style).label).join(' ');

  // ================================================================= afinaciones guardadas (SavedTuningStore.kt)
  // En el teléfono van a SharedPreferences; aquí al almacenamiento del navegador, si lo hay.
  const STORE_KEY = 'smarttuner.tunings';
  function loadSaved() {
    try {
      const list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      if (!Array.isArray(list)) return [];
      return list.filter((t) => t && instrumentById(t.inst) && typeof t.name === 'string' && Array.isArray(t.midis) && t.midis.length);
    } catch (e) {
      return [];
    }
  }
  function persistSaved() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S.saved)); } catch (e) { /* sin almacenamiento: dura lo que la pestaña */ }
  }
  const esc = (text) => String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  // ================================================================= estado
  const S = {
    theme: 'dark',
    colors: null,
    accidental: 'SHARPS',
    a4: 440,
    mode: 'chromatic',
    instrument: null,
    /** 'std:<tipo>:<afinación>' para las que trae la app, 'saved:<id>' para las guardadas. */
    tuningKey: 'std:0:0',
    selectedString: null,
    soundingString: null,
    soundingUntil: 0,
    sheet: null,
    pick: { inst: 'GUITAR', tuning: 0 },
    reading: null,
    instrumentReading: null,
    transitionUntil: 0,
    transitionFrom: null,
    saved: loadSaved(),
    /** Afinación nueva en curso: { base, order, captured: {cuerda: midi}, selected }. */
    add: null,
    menuOpen: false,
    dialog: false,
  };
  const sim = { on: true, midi: 45, cents: 12, autoTune: null };

  const tracker = {
    tuned: new Set(), current: null, inStreak: 0, outStreak: 0,
    update(match) {
      if (!match) { this.inStreak = this.outStreak = 0; return; }
      if (match.number !== this.current) { this.current = match.number; this.inStreak = this.outStreak = 0; }
      const d = Math.abs(match.cents);
      if (d <= IN_TUNE_CENTS) { this.inStreak++; this.outStreak = 0; }
      else if (d >= 15 && d <= 60) { this.outStreak++; this.inStreak = 0; }
      else { this.inStreak = this.outStreak = 0; }
      if (this.inStreak >= 10 && !this.tuned.has(match.number)) { this.tuned.add(match.number); onStringTuned(match.number); }
      if (this.outStreak >= 10) this.tuned.delete(match.number);
    },
    reset() { this.tuned.clear(); this.current = null; this.inStreak = this.outStreak = 0; },
  };

  // NoteCaptureTracker: fija la nota que se sostiene afinada 10 lecturas (~0.5 s). La recién
  // fijada no vuelve a valer hasta que calle o cambie, para no copiarla en la cuerda siguiente.
  const capture = {
    current: null, streak: 0, blocked: null, silent: 0,
    update(midi, cents) {
      if (midi == null) {
        this.restart();
        if (++this.silent >= 6) this.blocked = null;
        return null;
      }
      this.silent = 0;
      if (midi !== this.blocked) this.blocked = null;
      if (midi === this.blocked) return null;
      if (midi !== this.current) { this.current = midi; this.streak = 0; }
      this.streak = Math.abs(cents) <= IN_TUNE_CENTS ? this.streak + 1 : 0;
      if (this.streak < 10) return null;
      this.restart();
      this.blocked = midi;
      return midi;
    },
    restart() { this.current = null; this.streak = 0; },
    reset() { this.restart(); this.blocked = null; this.silent = 0; },
  };

  const isDark = () => S.theme === 'dark';
  const savedTuning = (t) => ({
    key: `saved:${t.id}`, name: t.name, saved: t,
    strings: t.midis.map((midi, i) => ({ number: i + 1, midi })),
  });
  /** Todas las del instrumento: las de la app por tipos y, detrás, las guardadas. */
  const allTunings = (inst) => [
    ...inst.types.flatMap((type) => type.tunings),
    ...S.saved.filter((t) => t.inst === inst.id).map(savedTuning),
  ];
  /** El tipo de una afinación es el que tiene sus mismas cuerdas; las propias también encajan. */
  const typeOf = (inst, tuning) => inst.types.find((type) => type.count === tuning.strings.length) || inst.types[0];
  /** Las del tipo: las que trae la app y las guardadas con sus mismas cuerdas. */
  const tuningsOf = (inst, type) => allTunings(inst).filter((t) => t.strings.length === type.count);
  const currentTuning = () => {
    const all = allTunings(S.instrument);
    return all.find((t) => t.key === S.tuningKey) || all[0];
  };
  const currentType = () => typeOf(S.instrument, currentTuning());
  const orderedStrings = () => [...currentTuning().strings].sort((a, b) => b.number - a.number);

  // ================================================================= animaciones
  class Spring {
    constructor(damping, stiffness, value = 0) { this.d = damping; this.k = stiffness; this.x = value; this.v = 0; this.target = value; }
    step(dt) {
      const c = 2 * this.d * Math.sqrt(this.k);
      for (let t = dt; t > 0; t -= 1 / 240) {
        const h = Math.min(t, 1 / 240);
        this.v += (-this.k * (this.x - this.target) - c * this.v) * h;
        this.x += this.v * h;
      }
    }
    snap(v) { this.x = this.target = v; this.v = 0; }
  }
  const approach = (cur, target, dt, ms) => cur + (target - cur) * (1 - Math.exp(-dt * 1000 / (ms / 3)));

  // ================================================================= utilidades de lienzo
  const DPR = () => Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  function prepare(canvas) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const r = DPR();
    if (canvas.width !== Math.round(w * r) || canvas.height !== Math.round(h * r)) {
      canvas.width = Math.round(w * r);
      canvas.height = Math.round(h * r);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return [ctx, w, h];
  }
  function radial(ctx, x, y, radius, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, css(color));
    g.addColorStop(1, css(alpha(color, 0)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  }

  // ---------------------------------------------------------------- LedTuningArc
  const SIDE_LIGHTS = 10, HALF_SWEEP = 62, LIGHT_LENGTH = 0.19, MAX_CENTS = 50;

  /**
   * Trazado del arco del afinador. Los dos modos lo comparten: el oscuro enciende sus luces
   * sobre él y el claro dibuja ahí la regleta, así el visor no se mueve al cambiar de modo.
   */
  function arcGeometry(W, H, pad = 6) {
    const sweep = HALF_SWEEP * Math.PI / 180;
    const radius = Math.min(
      (W / 2 - pad) / Math.sin(sweep),
      (H - pad * 2) / (1 - Math.cos(sweep) + LIGHT_LENGTH * Math.cos(sweep)),
    );
    const cx = W / 2, cy = pad + radius;
    return {
      radius,
      length: radius * LIGHT_LENGTH,
      /** Grados desde la vertical: −62 en −50 ¢ y +62 en +50 ¢. */
      angleOf: (cents) => -90 + clamp(cents / MAX_CENTS, -1, 1) * HALF_SWEEP,
      positionOf: (angle, distance) => {
        const r = angle * Math.PI / 180;
        return [cx + distance * Math.cos(r), cy + distance * Math.sin(r)];
      },
    };
  }

  function drawArc(canvas, o) {
    const [ctx, W, H] = prepare(canvas);
    const c = S.colors;
    const arc = arcGeometry(W, H);
    const radius = arc.radius;
    const length = arc.length;
    const step = radius * HALF_SWEEP * Math.PI / 180 / SIDE_LIGHTS;
    const angleOf = (i) => arc.angleOf(i / SIDE_LIGHTS * MAX_CENTS);
    const pos = (i, d) => arc.positionOf(angleOf(i), d);

    if (o.inTune && o.hasSignal) {
      const [ax, ay] = pos(0, radius - length / 2);
      radial(ctx, ax, ay, radius * 0.5, alpha(o.color, 0.22));
    }

    const target = clamp(o.cents / MAX_CENTS, -1, 1) * SIDE_LIGHTS;
    const reach = Math.abs(target);
    const idle = Math.sin(o.scan * 2 * Math.PI) * SIDE_LIGHTS;

    for (let i = -SIDE_LIGHTS; i <= SIDE_LIGHTS; i++) {
      const distance = Math.abs(i);
      let intensity;
      if (!o.hasSignal) intensity = Math.max(1 - Math.abs(i - idle) / 2, 0) * 0.4;
      else if (o.inTune) intensity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0;
      else if (i !== 0 && (i > 0) !== (target > 0)) intensity = 0;
      else if (distance > reach) intensity = Math.max(1 - (distance - reach), 0) * 0.85;
      else intensity = 0.3 + 0.7 * distance / Math.max(reach, 0.001);

      const lightLength = length * (i === 0 ? 1.3 : 1);
      const [x, y] = pos(i, radius - lightLength / 2);
      drawArcLight(ctx, x, y, angleOf(i) + 90, step * (i === 0 ? 0.58 : 0.42), lightLength,
        o.hasSignal ? o.color : c.accent, c.track, step * 2.2, intensity);
    }
  }
  function drawArcLight(ctx, x, y, rotation, width, length, color, offColor, halo, intensity) {
    if (intensity > 0.01) radial(ctx, x, y, halo, alpha(color, 0.28 * intensity));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    roundRect(ctx, -width / 2, -length / 2, width, length, width / 2);
    ctx.fillStyle = css(offColor);
    ctx.fill();
    if (intensity > 0.01) {
      roundRect(ctx, -width / 2, -length / 2, width, length, width / 2);
      ctx.fillStyle = css(alpha(color, 0.25 + 0.75 * intensity));
      ctx.fill();
      if (intensity > 0.7) {
        const inset = width * 0.3;
        roundRect(ctx, -width / 2 + inset, -length / 2 + length * 0.14, width - inset * 2, length * 0.72, width / 2);
        ctx.fillStyle = css(alpha(PALETTE.white, (intensity - 0.7) * 1.2));
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- SevenSegment
  const A = 1, B = 2, C = 4, D = 8, E = 16, F = 32, G = 64;
  const GLYPHS = {
    0: A | B | C | D | E | F, 1: B | C, 2: A | B | D | E | G, 3: A | B | C | D | G, 4: B | C | F | G,
    5: A | C | D | F | G, 6: A | C | D | E | F | G, 7: A | B | C, 8: A | B | C | D | E | F | G, 9: A | B | C | D | F | G,
    A: A | B | C | E | F | G, B: C | D | E | F | G, C: A | D | E | F, D: B | C | D | E | G,
    E: A | D | E | F | G, F: A | E | F | G, G: A | C | D | E | F, '-': G, ' ': 0,
  };
  const SLANT = 0.07, OFF_ALPHA = 0.075;

  function drawSegmentText(canvas, text, color, glow) {
    const [ctx, W, H] = prepare(canvas);
    const count = Math.max(text.length, 1);
    const gap = count > 1 ? W * 0.10 : 0;
    const charWidth = (W - gap * (count - 1)) / count;
    [...text].forEach((ch, i) => drawSegmentChar(ctx, ch, i * (charWidth + gap), 0, charWidth, H, color, glow));
  }
  function drawSegmentChar(ctx, ch, ox, oy, areaW, height, color, glow) {
    const mask = GLYPHS[ch.toUpperCase()] ?? 0;
    const width = Math.max(areaW - height * SLANT, 1);
    const thickness = Math.min(height * 0.135, width * 0.30);
    const half = thickness / 2;
    const gap = thickness * 0.34;
    const p = (x, y) => [ox + x + (height - y) * SLANT, oy + y];
    const horizontal = (y) => [p(gap, y), p(gap + half, y - half), p(width - gap - half, y - half), p(width - gap, y), p(width - gap - half, y + half), p(gap + half, y + half)];
    const vertical = (x, top, bottom) => {
      const s = top + gap, e = bottom - gap;
      return [p(x, s), p(x + half, s + half), p(x + half, e - half), p(x, e), p(x - half, e - half), p(x - half, s + half)];
    };
    const middle = height / 2;
    const segments = [
      [A, horizontal(half)], [G, horizontal(middle)], [D, horizontal(height - half)],
      [F, vertical(half, half, middle)], [B, vertical(width - half, half, middle)],
      [E, vertical(half, middle, height - half)], [C, vertical(width - half, middle, height - half)],
    ];
    for (const [flag, pts] of segments) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      if (mask & flag) {
        if (glow > 0) {
          ctx.lineJoin = 'miter';
          ctx.strokeStyle = css(alpha(color, 0.05 * glow * color.a));
          ctx.lineWidth = thickness * 1.3;
          ctx.stroke();
          ctx.strokeStyle = css(alpha(color, 0.16 * glow * color.a));
          ctx.lineWidth = thickness * 0.45;
          ctx.stroke();
        }
        ctx.fillStyle = css(color);
      } else {
        ctx.fillStyle = css(alpha(color, OFF_ALPHA * color.a));
      }
      ctx.fill();
    }
  }
  function drawAccidental(canvas, sharp, lit, color, glow) {
    const [ctx, w, h] = prepare(canvas);
    const stroke = Math.min(w, h) * 0.13;
    const path = new Path2D();
    if (sharp) {
      path.moveTo(w * 0.38, h * 0.08); path.lineTo(w * 0.30, h * 0.92);
      path.moveTo(w * 0.70, h * 0.08); path.lineTo(w * 0.62, h * 0.92);
      path.moveTo(w * 0.14, h * 0.44); path.lineTo(w * 0.86, h * 0.34);
      path.moveTo(w * 0.14, h * 0.72); path.lineTo(w * 0.86, h * 0.62);
    } else {
      path.moveTo(w * 0.32, h * 0.06); path.lineTo(w * 0.32, h * 0.90);
      path.moveTo(w * 0.32, h * 0.48);
      path.bezierCurveTo(w * 0.82, h * 0.42, w * 0.78, h * 0.84, w * 0.32, h * 0.90);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (lit) {
      if (glow > 0) {
        ctx.strokeStyle = css(alpha(color, 0.06 * glow * color.a)); ctx.lineWidth = stroke * 2.2; ctx.stroke(path);
        ctx.strokeStyle = css(alpha(color, 0.16 * glow * color.a)); ctx.lineWidth = stroke * 1.4; ctx.stroke(path);
      }
      ctx.strokeStyle = css(color);
    } else {
      ctx.strokeStyle = css(alpha(color, OFF_ALPHA * color.a));
    }
    ctx.lineWidth = stroke;
    ctx.stroke(path);
  }

  // ================================================================= DOM: visor (TunerDial)
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  const setStyle = (el, prop, value) => { if (el.style[prop] !== value) el.style[prop] = value; };

  function createVisor(host) {
    host.innerHTML = `
      <div class="dial">
      <canvas class="arc"></canvas>
      <div class="dial-row">
        <div class="neighbor"><span class="overline">◀ GRAVE</span><span class="n-note">–</span></div>
        <div class="note-display">
          <div class="note-row">
            <div class="halo"></div>
            <canvas class="letter"></canvas>
            <div class="cells">
              <div class="cell"><canvas class="acc"></canvas></div>
              <div class="cell"><canvas class="oct"></canvas></div>
            </div>
          </div>
          <div class="note-caption"></div>
        </div>
        <div class="neighbor end"><span class="overline">AGUDO ▶</span><span class="n-note">–</span></div>
      </div>
      </div>
      <div class="paper-dial" hidden>
        <canvas class="paper-arc"></canvas>
        <div class="paper-note">
          <div class="note-ring">
            <div class="note-glyph" hidden>
              <span class="ng-letter">A</span>
              <span class="ng-side"><span class="ng-acc"></span><span class="ng-oct"></span></span>
            </div>
            <span class="ng-empty">–</span>
          </div>
          <div class="note-caption"></div>
        </div>
      </div>`;
    const notes = $$('.n-note', host);
    return {
      neon: $('.dial', host), paper: $('.paper-dial', host),
      arc: $('.arc', host), letter: $('.letter', host), acc: $('.acc', host), oct: $('.oct', host),
      halo: $('.halo', host), caption: $('.dial .note-caption', host), low: notes[0], high: notes[1],
      ring: $('.note-glyph', host), empty: $('.ng-empty', host), ngLetter: $('.ng-letter', host),
      ngAcc: $('.ng-acc', host), ngOct: $('.ng-oct', host),
      paperCaption: $('.paper-dial .note-caption', host), paperArc: $('.paper-arc', host),
      cents: new Spring(0.7, 200), color: null, glow: 0.2, halo_: 0.07,
      grow: new Spring(0.5, 1500, 0),
    };
  }
  function createStats(host) {
    host.innerHTML = ['FRECUENCIA', 'DESVIACIÓN', 'OBJETIVO']
      .map((l) => `<div class="stat"><span class="s-label">${l}</span><span class="s-value">—</span></div>`).join('');
    return { values: $$('.s-value', host) };
  }

  /**
   * Regleta curvada del modo claro (PitchArc en PaperDial.kt): las mismas rayas de una
   * regleta, pero sobre el trazado del arco, para que el visor no se mueva al cambiar de modo.
   */
  function drawPaperArc(canvas, o) {
    const [ctx, W, H] = prepare(canvas);
    const c = S.colors;
    const arc = arcGeometry(W, H);

    ctx.lineCap = 'round';
    // Cada raya apunta al centro del arco: va del borde de fuera hacia dentro.
    const tick = (at, length, color, width) => {
      const angle = arc.angleOf(at);
      const [x1, y1] = arc.positionOf(angle, arc.radius);
      const [x2, y2] = arc.positionOf(angle, arc.radius - length);
      ctx.strokeStyle = css(color);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    for (let at = -MAX_CENTS; at <= MAX_CENTS + 0.01; at += 2.5) {
      const quarter = Number.isInteger(at) && at % 25 === 0;
      if (at === 0) tick(at, arc.length, alpha(c.textPrimary, 0.55), 1.6);
      else tick(at, arc.length * (quarter ? 0.68 : 0.40), c.tick, 1);
    }
    if (!o.hasSignal) return;

    // Aguja: lo que entra por el micrófono. Crece al caer sobre la nota.
    tick(o.cents, arc.length * (1.24 + 0.6 * o.grow), c.textPrimary, 2.4 + 1.4 * o.grow);
  }

  function renderDial(dial, v, dt, scan) {
    const c = S.colors;
    const dark = isDark();
    dial.cents.target = v.hasSignal ? v.cents : 0;
    dial.cents.step(dt);
    const target = tuningColor(v.cents, v.hasSignal, c);
    dial.color = dial.color ? mixRgb(dial.color, target, 1 - Math.exp(-dt * 1000 / 83)) : target;
    // Sin brillos en el modo claro: un halo sobre papel solo ensucia el dibujo.
    dial.glow = approach(dial.glow, (v.hasSignal ? 1 : 0.2) * c.glow, dt, 300);
    dial.halo_ = approach(dial.halo_, (v.inTune ? 0.26 : 0.07) * c.glow, dt, 350);

    dial.neon.hidden = !dark;
    dial.paper.hidden = dark;
    if (!dark) return renderPaper(dial, v, dt);

    drawArc(dial.arc, { cents: dial.cents.x, hasSignal: v.hasSignal, inTune: v.inTune, color: dial.color, scan });

    const letterColor = v.hasSignal ? dial.color : alpha(c.textMuted, 0.6);
    const cellColor = v.hasSignal ? c.accent : alpha(c.accent, 0.55);
    const note = v.note;
    drawSegmentText(dial.letter, note ? note.letter : '-', letterColor, dial.glow);
    const sharp = note && note.acc ? note.acc === '♯' : S.accidental === 'SHARPS';
    drawAccidental(dial.acc, sharp, !!(note && note.acc), cellColor, dial.glow);
    drawSegmentText(dial.oct, note ? String(note.octave) : '-', cellColor, dial.glow);

    const r = 86.07;
    setStyle(dial.halo, 'width', `${r * 2}px`);
    setStyle(dial.halo, 'height', `${r * 2}px`);
    setStyle(dial.halo, 'margin', `${-r}px 0 0 ${-r}px`);
    setStyle(dial.halo, 'background', `radial-gradient(circle closest-side, ${css(alpha(letterColor, dial.halo_ * letterColor.a))}, ${css(alpha(letterColor, 0))})`);

    setText(dial.caption, note ? note.solfegeLabel : v.emptyLabel);
    setText(dial.low, v.lower ? v.lower.label : '–');
    setText(dial.high, v.upper ? v.upper.label : '–');
  }

  /** Visor del modo claro: la nota escrita en el aro y la aguja de la regleta. */
  function renderPaper(dial, v, dt) {
    const note = v.note;
    dial.ring.hidden = !note;
    dial.empty.hidden = !!note;
    if (note) {
      setText(dial.ngLetter, note.letter);
      // El hueco se mantiene aunque la nota no lleve alteración, para que no baile la octava.
      setText(dial.ngAcc, note.acc || ' ');
      setText(dial.ngOct, String(note.octave));
    }
    setText(dial.paperCaption, note ? note.solfegeLabel : v.emptyLabel);
    dial.grow.target = v.inTune && v.hasSignal ? 1 : 0;
    dial.grow.step(dt);
    drawPaperArc(dial.paperArc, { cents: dial.cents.x, hasSignal: v.hasSignal, grow: dial.grow.x });
  }

  function renderStatus(el, text, color, idle, pulsing) {
    setText(el, text);
    setStyle(el, 'color', css(idle ? S.colors.textMuted : color));
    el.classList.toggle('pulsing', pulsing);
  }

  // ================================================================= lectura (lo que "oye" el micrófono)
  function readSound() {
    if (!sim.on || S.soundingString != null) return null;
    const jitter = (Math.random() - 0.5) * 1.2;
    return midiToFreq(sim.midi + (sim.cents + jitter) / 100, 440);
  }

  function tick() {
    const now = performance.now();
    if (S.soundingString != null && now > S.soundingUntil) S.soundingString = null;
    const freq = readSound();

    if (freq == null) {
      S.reading = { hasSignal: false, freq: null };
    } else {
      const m = freqToMidi(freq, S.a4);
      const nearest = Math.round(m);
      S.reading = { hasSignal: true, freq, nearest, cents: (m - nearest) * 100 };
    }

    if (S.mode === 'add' && S.add && S.add.selected != null) {
      const r = S.reading;
      const midi = capture.update(r.hasSignal ? r.nearest : null, r.hasSignal ? r.cents : 0);
      if (midi != null) captureNote(midi);
    }

    S.instrumentReading = null;
    if (S.mode !== 'instrument') return;
    const tuning = currentTuning();
    let match = null;
    if (freq != null) {
      const m = freqToMidi(freq, S.a4);
      const string = S.selectedString != null
        ? tuning.strings.find((s) => s.number === S.selectedString)
        : tuning.strings.reduce((best, s) => (Math.abs(m - s.midi) < Math.abs(m - best.midi) ? s : best));
      match = { string, number: string.number, cents: (m - string.midi) * 100 };
    }
    tracker.update(match);
    S.instrumentReading = { hasSignal: freq != null, freq, match };
  }

  // ================================================================= pantallas
  const el = {};
  let dials, stats;

  function viewChromatic() {
    const r = S.reading;
    const hasNote = r && r.hasSignal;
    const note = hasNote ? noteName(r.nearest, S.accidental) : null;
    const cents = hasNote ? r.cents : 0;
    return {
      hasSignal: !!hasNote,
      cents,
      inTune: hasNote && Math.abs(cents) <= IN_TUNE_CENTS,
      note,
      lower: hasNote ? noteName(r.nearest - 1, S.accidental) : null,
      upper: hasNote ? noteName(r.nearest + 1, S.accidental) : null,
      frequency: hasNote ? r.freq : 0,
      emptyLabel: 'Toca o canta una nota',
    };
  }

  function viewInstrument() {
    const r = S.instrumentReading;
    const strings = orderedStrings();
    const match = r && r.match;
    const active = !!(r && r.hasSignal && match);
    const cents = match ? match.cents : 0;
    const idx = match ? strings.findIndex((s) => s.number === match.number) : -1;
    return {
      hasSignal: active,
      cents,
      inTune: active && Math.abs(cents) <= IN_TUNE_CENTS,
      note: active ? noteName(match.string.midi, S.accidental) : null,
      lower: active && idx > 0 ? noteName(strings[idx - 1].midi, S.accidental) : null,
      upper: active && idx >= 0 && strings[idx + 1] ? noteName(strings[idx + 1].midi, S.accidental) : null,
      frequency: active ? r.freq : 0,
      emptyLabel: 'Toca una cuerda al aire',
      match, active, strings,
    };
  }

  function renderChromatic(dt, scan) {
    const v = viewChromatic();
    const r = S.reading;
    renderDial(dials.chromatic, v, dt, scan);
    const color = dials.chromatic.color;

    setText(stats.chromatic.values[0], v.hasSignal ? formatHz(r.freq) : '— Hz');
    setText(stats.chromatic.values[1], v.hasSignal ? formatCents(r.cents) : '— ¢');
    setText(stats.chromatic.values[2], v.hasSignal ? formatHz(midiToFreq(r.nearest, S.a4)) : '— Hz');

    let text = 'Esperando sonido…';
    if (v.hasSignal) text = v.inTune ? '¡Afinado!' : v.cents < 0 ? 'Grave · sube la afinación' : 'Agudo · baja la afinación';
    renderStatus(el.statusChromatic, text, color, !v.hasSignal, !v.hasSignal);
  }

  // ---------------------------------------------------------------- afinación por instrumento
  let stringCards = [];

  function buildInstrumentScreen() {
    const inst = S.instrument;
    setText(el.instName, inst.name);
    // El tipo y la afinación se cambian desde el botón de la esquina; la cabecera dice cuáles
    // están en uso. El tipo solo se nombra si el instrumento tiene más de uno.
    const parts = [inst.types.length > 1 ? currentType().name : null, currentTuning().name, 'La 440'];
    setText($('[data-ref-label]'), parts.filter(Boolean).join(' · '));
    renderAvatars();
    stringCards = buildCards(el.strings, orderedStrings(), (n) => `Afinar y escuchar la cuerda ${n}`, selectString);
    renderSimStrings();
  }

  /** El instrumento en grande en las cabeceras de sus tres pantallas. */
  function renderAvatars() {
    if (!S.instrument) return;
    $$('[data-inst-avatar], #instAvatar').forEach((avatar) => {
      avatar.setAttribute('aria-label', S.instrument.name);
      avatar.innerHTML = instrumentGlyph(S.instrument.icon);
    });
  }

  /** Tarjetas de cuerda (StringCard): se crean una vez y paintCard las repinta en cada cuadro. */
  function buildCards(host, strings, ariaLabel, onSelect) {
    host.innerHTML = strings.map((s) => `
      <div class="sc-wrap" data-n="${s.number}">
        <div class="aura"></div>
        <div class="ring r1"></div><div class="ring r2"></div>
        <button class="string-card" role="radio" aria-checked="false" aria-label="${ariaLabel(s.number)}">
          <span class="flag"></span>
          <span class="sc-num"></span>
          <span class="sc-note"></span>
          <span class="sc-hz"></span>
        </button>
      </div>`).join('');
    return $$('.sc-wrap', host).map((wrap) => {
      const n = Number(wrap.dataset.n);
      const card = $('.string-card', wrap);
      card.addEventListener('click', () => onSelect(n));
      return {
        n, wrap, card, aura: $('.aura', wrap), flag: $('.flag', wrap), num: $('.sc-num', wrap),
        note: $('.sc-note', wrap), hz: $('.sc-hz', wrap),
        string: strings.find((s) => s.number === n),
        scale: new Spring(1, 1500, 1), beat: 0,
      };
    });
  }

  /**
   * Mientras te acercas a la afinación la tarjeta late cada vez más rápido y con más brillo.
   * Con `placeholder` la cuerda aún no tiene nota y el número ocupa su lugar, atenuado.
   */
  function paintCard(card, o, dt) {
    const c = S.colors;
    const border = o.isActive ? o.color : o.isTuned ? c.inTune : o.isSelected ? c.accent : alpha(c.accent, 0);
    setStyle(card.card, 'borderColor', css(border));
    const bg = o.isTuned ? alpha(c.inTune, 0.12) : o.isSelected ? alpha(c.accent, 0.12) : c.surface;
    setStyle(card.card, 'backgroundColor', css(bg));
    card.card.setAttribute('aria-checked', String(o.isSelected));
    setStyle(card.flag, 'backgroundColor', o.isSelected ? css(c.accent) : 'transparent');
    setText(card.num, o.num);
    setStyle(card.num, 'color', css(o.isTuned ? c.inTune : o.isActive ? o.color : o.isSelected ? c.accent : c.textMuted));
    setText(card.note, o.note);
    setStyle(card.note, 'color', css(!o.placeholder ? c.textPrimary : o.isSelected ? c.accent : c.textMuted));
    setText(card.hz, o.hz);

    const proximity = o.isActive && !o.isTuned ? 1 - clamp(Math.abs(o.cents) / 50, 0, 1) : 0;
    card.beat = proximity > 0 ? (card.beat + dt * (0.8 + 2.6 * proximity)) % 1 : 0;
    const pulse = Math.sin(card.beat * 2 * Math.PI) * 0.5 + 0.5;
    const aura = proximity * (0.4 + 0.6 * pulse) * c.glow;
    const radius = Math.max(card.card.offsetWidth, card.card.offsetHeight) * 0.8;
    setStyle(card.aura, 'background', aura > 0.01
      ? `radial-gradient(circle ${radius}px at 50% 50%, ${css(alpha(o.color, 0.45 * aura))}, ${css(alpha(o.color, 0))})`
      : 'none');
    card.scale.target = o.isActive ? 1.08 : 1;
    card.scale.step(dt);
    const s = card.scale.x * (1 + 0.05 * proximity * pulse);
    setStyle(card.card, 'transform', `scale(${s.toFixed(4)})`);
  }

  function onStringTuned(number) {
    wave(stringCards, number);
  }

  /** Onda de confirmación que sale de la tarjeta al quedar afinada. */
  function wave(cards, number) {
    const card = cards.find((c) => c.n === number);
    if (!card) return;
    card.wrap.classList.remove('wave');
    void card.wrap.offsetWidth;
    card.wrap.classList.add('wave');
  }

  function renderInstrument(dt, scan) {
    const v = viewInstrument();
    const c = S.colors;
    renderDial(dials.instrument, v, dt, scan);
    const color = dials.instrument.color;
    const r = S.instrumentReading;

    setText(stats.instrument.values[0], v.active ? formatHz(r.freq) : '— Hz');
    setText(stats.instrument.values[1], v.active ? formatCents(v.cents) : '— ¢');
    const targetString = v.match ? v.match.string : currentTuning().strings.find((s) => s.number === S.selectedString);
    setText(stats.instrument.values[2], targetString ? formatHz(midiToFreq(targetString.midi, S.a4)) : '— Hz');

    const sounding = S.soundingString;
    let text;
    if (sounding != null) text = `Sonando la cuerda ${sounding} · no te escucho`;
    else if (!v.active) text = 'Toca una cuerda al aire';
    else if (v.inTune) text = `Cuerda ${v.match.number} afinada`;
    else if (v.cents < 0) text = `Cuerda ${v.match.number} grave · sube`;
    else text = `Cuerda ${v.match.number} aguda · baja`;
    renderStatus(el.statusInstrument, text, sounding != null ? c.accent : color, sounding == null && !v.active, sounding != null || !v.active);

    for (const card of stringCards) {
      const isActive = v.active && v.match.number === card.n;
      paintCard(card, {
        isActive,
        isSelected: S.selectedString === card.n,
        isTuned: tracker.tuned.has(card.n),
        cents: v.cents,
        color,
        num: String(card.n),
        note: noteName(card.string.midi, S.accidental).label,
        hz: midiToFreq(card.string.midi, S.a4).toFixed(1),
      }, dt);
    }

    const total = currentTuning().strings.length;
    const done = tracker.tuned.size;
    const allTuned = done === total;
    let hint;
    if (S.selectedString != null) hint = `Afinando la cuerda ${S.selectedString} · tócala otra vez para soltarla`;
    else if (allTuned) hint = '¡Instrumento afinado!';
    else hint = `${done} de ${total} cuerdas afinadas`;
    setText(el.footerHint, hint);
    el.footerHint.classList.toggle('done', allTuned && S.selectedString == null);
  }

  // ================================================================= acciones (TunerViewModel)
  function setAccidental(style) {
    S.accidental = style;
    $$('.segmented button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.acc === style)));
    renderSimStrings();
    renderSimNote();
  }

  // Aviso de un segundo al cambiar entre sostenidos y bemoles; cada toque lo reinicia.
  const NOTICE_MILLIS = 1000;
  let noticeTimer = 0;
  function announceAccidental(style) {
    const notice = $('#accNotice');
    setText(notice, style === 'SHARPS' ? 'Ahora verás las notas con sostenidos ♯' : 'Ahora verás las notas con bemoles ♭');
    notice.classList.add('show');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.classList.remove('show'), 150 + NOTICE_MILLIS);
  }

  function acceptPick() {
    const inst = instrumentById(S.pick.inst);
    closeSheet();
    S.instrument = inst;
    S.tuningKey = `std:${S.pick.type}:0`;
    S.selectedString = null;
    stopTone();
    tracker.reset();
    buildInstrumentScreen();
    dials.instrument.cents.snap(0);
    dials.instrument.color = null;
    const lowest = currentTuning().strings.reduce((a, b) => (a.midi < b.midi ? a : b));
    setSim(lowest.midi, randomOffset());
    if (S.mode !== 'instrument') navigate('instrument');
  }

  function closeInstrumentTuning() {
    setMenu(false);
    tracker.reset();
    stopTone();
    S.selectedString = null;
    navigate('chromatic');
  }

  function selectString(number) {
    const releasing = S.selectedString === number;
    tracker.update(null);
    S.selectedString = releasing ? null : number;
    if (releasing) { stopTone(); return; }
    const string = currentTuning().strings.find((s) => s.number === number);
    playTone(midiToFreq(string.midi, S.a4));
    S.soundingString = number;
    S.soundingUntil = performance.now() + 1600 + 300;
    // Al elegir una cuerda, el simulador pasa a "tocar" esa cuerda, algo desafinada.
    if (sim.midi !== string.midi) setSim(string.midi, randomOffset());
  }

  /** Lo adentro que está cada pantalla: decide hacia qué lado se desliza al cambiar. */
  const DEPTH = { chromatic: 0, instrument: 1, add: 2, saved: 2, types: 2 };

  function navigate(to) {
    const from = S.mode;
    if (from === to) return;
    const incoming = el.screens[to];
    const outgoing = el.screens[from];
    const dir = DEPTH[to] >= DEPTH[from] ? 1 : -1;
    S.mode = to;
    incoming.classList.add('no-anim');
    incoming.style.transform = `translateX(${dir * 100}%)`;
    incoming.style.opacity = '0';
    void incoming.offsetWidth;
    incoming.classList.remove('no-anim');
    incoming.style.transform = 'translateX(0)';
    incoming.style.opacity = '1';
    incoming.style.pointerEvents = '';
    incoming.removeAttribute('aria-hidden');
    outgoing.style.transform = `translateX(${-dir * 33.333}%)`;
    outgoing.style.opacity = '0';
    outgoing.style.pointerEvents = 'none';
    outgoing.setAttribute('aria-hidden', 'true');
    $('#simStringsBlock').hidden = !(to === 'instrument' || to === 'add');
    // Mientras dura el deslizamiento se ven las dos pantallas, así que hay que dibujar ambas.
    S.transitionFrom = from;
    S.transitionUntil = performance.now() + 360;
    fitTitles();
    tick();
  }

  // ================================================================= afinaciones propias
  const LIST_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12"/><circle cx="4" cy="5" r="1.8" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="4" cy="19" r="1.8" fill="currentColor" stroke="none"/></svg>';
  const TRASH_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M9 6V3.5h6V6M6 6l1 14.5h10L18 6M10 10v7M14 10v7"/></svg>';
  let addCards = [];

  // Botón de la esquina: el "+" gira hasta ser una "×" y despliega sus dos opciones.
  function setMenu(open) {
    S.menuOpen = open;
    $('#tuningMenu').classList.toggle('open', open);
    $('#menuScrim').classList.toggle('open', open);
    const button = $('#menuBtn');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Cerrar opciones de afinación' : 'Opciones de afinación');
  }

  /**
   * Afinación nueva con tantas cuerdas como la que está en uso. Salen con su número y la
   * primera (la más grave) queda elegida para empezar sin más toques.
   */
  function openAdd() {
    setMenu(false);
    stopTone();
    tracker.reset();
    capture.reset();
    S.selectedString = null;
    const base = currentTuning();
    const strings = [...base.strings].sort((a, b) => b.number - a.number);
    S.add = { base, order: strings.map((s) => s.number), captured: {}, selected: strings[0].number };
    setText($('#addSub'), `${S.instrument.name} · ${strings.length} cuerdas`);
    renderAvatars();
    addCards = buildCards(el.addStrings, strings, (n) => `Afinar la cuerda ${n}`, selectAddString);
    dials.add.cents.snap(0);
    dials.add.color = null;
    navigate('add');
  }

  const addComplete = () => S.add.order.every((n) => S.add.captured[n] != null);

  /** Elegir una cuerda de la afinación nueva no suena: aún no tiene nota. */
  function selectAddString(number) {
    capture.restart();
    S.add.selected = number;
  }

  /** Fija la nota en la cuerda elegida y pasa a la siguiente que siga sin nota. */
  function captureNote(midi) {
    const a = S.add;
    const number = a.selected;
    a.captured[number] = midi;
    wave(addCards, number);
    const start = a.order.indexOf(number);
    a.selected = null;
    for (let i = 1; i <= a.order.length; i++) {
      const next = a.order[(start + i) % a.order.length];
      if (a.captured[next] == null) { a.selected = next; break; }
    }
  }

  function renderAdd(dt, scan) {
    const a = S.add;
    const c = S.colors;
    const r = S.reading;
    const selected = a.selected;
    // Se escucha como el afinador cromático: la nota más cercana, sea cual sea. La que se
    // acaba de fijar y aún resuena no cuenta para la cuerda siguiente.
    const active = !!(r && r.hasSignal && selected != null && r.nearest !== capture.blocked);
    const cents = active ? r.cents : 0;
    const v = {
      hasSignal: active,
      cents,
      inTune: active && Math.abs(cents) <= IN_TUNE_CENTS,
      note: active ? noteName(r.nearest, S.accidental) : null,
      lower: active ? noteName(r.nearest - 1, S.accidental) : null,
      upper: active ? noteName(r.nearest + 1, S.accidental) : null,
      emptyLabel: 'Toca la cuerda elegida',
    };
    renderDial(dials.add, v, dt, scan);
    const color = dials.add.color;

    setText(stats.add.values[0], active ? formatHz(r.freq) : '— Hz');
    setText(stats.add.values[1], active ? formatCents(cents) : '— ¢');
    setText(stats.add.values[2], active ? formatHz(midiToFreq(r.nearest, S.a4)) : '— Hz');

    const complete = addComplete();
    let text;
    if (selected == null) text = complete ? 'Todas las cuerdas tienen nota' : 'Elige una cuerda para afinarla';
    else if (!active) text = `Toca la cuerda ${selected} en la nota que quieras`;
    else if (v.inTune) text = `Cuerda ${selected} en ${v.note.label} · mantenla`;
    else if (cents < 0) text = `Cuerda ${selected} grave · sube`;
    else text = `Cuerda ${selected} aguda · baja`;
    renderStatus(el.statusAdd, text, selected == null ? c.inTune : color, selected != null && !active, selected != null && !active);

    for (const card of addCards) {
      const captured = a.captured[card.n];
      const live = active && card.n === selected;
      const shown = live ? r.nearest : captured;
      const placeholder = shown == null;
      paintCard(card, {
        isActive: live,
        isSelected: card.n === selected,
        isTuned: captured != null,
        cents,
        color,
        placeholder,
        num: placeholder ? '' : String(card.n),
        note: placeholder ? String(card.n) : noteName(shown, S.accidental).label,
        hz: live ? r.freq.toFixed(1) : captured != null ? midiToFreq(captured, S.a4).toFixed(1) : '—',
      }, dt);
    }

    const done = a.order.filter((n) => a.captured[n] != null).length;
    setText(el.addHint, complete ? 'Lista para guardar' : `${done} de ${a.order.length} cuerdas afinadas · guarda al terminar`);
    el.addHint.classList.toggle('done', complete);
    // Guardar se desbloquea cuando todas las cuerdas tienen nota.
    if (el.saveBtn.disabled === complete) el.saveBtn.disabled = !complete;
  }

  function openSaveDialog() {
    if (!S.add || !addComplete()) return;
    const count = S.saved.filter((t) => t.inst === S.instrument.id).length;
    openDialog({
      title: 'Guardar afinación',
      body: 'Ponle un nombre para encontrarla en Afinaciones.',
      input: `Mi afinación ${count + 1}`,
      confirm: 'Guardar',
      onConfirm: (name) => {
        const a = S.add;
        const entry = {
          id: Date.now(),
          inst: S.instrument.id,
          name: name.trim(),
          midis: a.base.strings.map((s) => a.captured[s.number]),
        };
        S.saved.push(entry);
        persistSaved();
        showInstrument(`saved:${entry.id}`, true);
      },
    });
  }

  /** Vuelve a afinar el instrumento con `key`; `retune` deja el simulador en su cuerda más grave. */
  function showInstrument(key, retune) {
    S.tuningKey = key;
    tracker.reset();
    capture.reset();
    stopTone();
    S.selectedString = null;
    buildInstrumentScreen();
    dials.instrument.cents.snap(0);
    dials.instrument.color = null;
    if (retune) {
      const lowest = currentTuning().strings.reduce((a, b) => (a.midi < b.midi ? a : b));
      setSim(lowest.midi, randomOffset());
    }
    navigate('instrument');
  }

  function backToInstrument() {
    showInstrument(S.tuningKey, false);
  }

  function openSaved() {
    setMenu(false);
    stopTone();
    tracker.reset();
    S.selectedString = null;
    setText($('#savedSub'), `${S.instrument.name} · ${currentType().name}`);
    renderAvatars();
    renderSaved();
    navigate('saved');
  }

  /** Tipos del instrumento: cuántas cuerdas tiene. Elegir uno afina con su estándar. */
  function openTypes() {
    setMenu(false);
    stopTone();
    tracker.reset();
    S.selectedString = null;
    setText($('#typesSub'), S.instrument.name);
    renderAvatars();
    const current = currentType();
    $('#typesBody').innerHTML = `
      <p class="types-hint">Cuántas cuerdas tiene tu instrumento. Las afinaciones y Agregar afinación usan las cuerdas del tipo elegido.</p>
      <div class="saved-list">${S.instrument.types.map((type, i) => {
        const inUse = type === current;
        const count = tuningsOf(S.instrument, type).length;
        return `
        <div class="saved-row${inUse ? ' in-use' : ''}">
          <button class="saved-main" data-type="${i}">
            <span class="sr-title"><b>${type.name}</b>${inUse ? '<span class="sr-badge">EN USO</span>' : ''}</span>
            <span class="sr-sub">${stringLabels(type.tunings[0], S.accidental)} · ${count} ${count === 1 ? 'afinación' : 'afinaciones'}</span>
          </button>
        </div>`;
      }).join('')}
      </div>`;
    navigate('types');
  }

  function onTypesClick(e) {
    const button = e.target.closest('[data-type]');
    if (!button) return;
    const type = S.instrument.types[Number(button.dataset.type)];
    // El mismo tipo conserva la afinación que hubiera (Drop D sigue siendo de 6 cuerdas).
    if (type === currentType()) return showInstrument(S.tuningKey, false);
    showInstrument(type.tunings[0].key, true);
  }

  /**
   * Afinaciones del tipo en uso: primero las que trae la app y debajo las guardadas, que se
   * pueden borrar. La que está en uso va marcada.
   */
  function renderSaved() {
    const type = currentType();
    const saved = S.saved.filter((t) => t.inst === S.instrument.id && t.midis.length === type.count);
    const row = (tuning, name, deletable) => {
      const inUse = tuning.key === S.tuningKey;
      return `
        <div class="saved-row${inUse ? ' in-use' : ''}">
          <button class="saved-main" data-apply="${tuning.key}">
            <span class="sr-title"><b>${esc(name)}</b>${inUse ? '<span class="sr-badge">EN USO</span>' : ''}</span>
            <span class="sr-sub">${stringLabels(tuning, S.accidental)}</span>
          </button>
          ${deletable ? `<button class="icon-circle ghost" data-delete="${tuning.saved.id}" aria-label="Borrar ${esc(name)}">${TRASH_ICON}</button>` : ''}
        </div>`;
    };
    $('#savedBody').innerHTML = `
      <div class="saved-list">
        <div class="section-label">PREDETERMINADAS</div>
        ${type.tunings.map((t) => row(t, t.name, false)).join('')}
        <div class="section-label list-gap">GUARDADAS · ${saved.length}</div>
        ${saved.length ? saved.map((entry) => row(savedTuning(entry), entry.name, true)).join('') : `
        <div class="saved-empty">
          <p>Aún no tienes afinaciones de ${type.name} guardadas. Créalas con Agregar afinación.</p>
          <button class="btn-secondary touch" data-saved-act="add">Agregar afinación</button>
        </div>`}
      </div>`;
  }

  function onSavedClick(e) {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.savedAct === 'add') return openAdd();
    if (button.dataset.apply) return showInstrument(button.dataset.apply, button.dataset.apply !== S.tuningKey);
    const entry = S.saved.find((t) => String(t.id) === button.dataset.delete);
    if (!entry) return;
    openDialog({
      title: '¿Borrar la afinación?',
      body: `«${entry.name}» se borrará de este teléfono.`,
      confirm: 'Borrar',
      onConfirm: () => {
        // El tipo se mira antes de borrarla: después ya no se encuentra.
        const type = typeOf(S.instrument, savedTuning(entry));
        S.saved = S.saved.filter((t) => t.id !== entry.id);
        persistSaved();
        // Si se borra la que estaba en uso, al volver se afina con la estándar de su tipo.
        if (S.tuningKey === `saved:${entry.id}`) S.tuningKey = type.tunings[0].key;
        renderSaved();
      },
    });
  }

  // ---------------------------------------------------------------- diálogos (TunerDialog)
  let dialogConfirm = null;
  function openDialog({ title, body, input, confirm, onConfirm }) {
    const d = el.dialog;
    d.innerHTML = `
      <h3 id="dialogTitle"></h3>
      <p></p>
      ${input != null ? '<input type="text" maxlength="32" aria-labelledby="dialogTitle" autocomplete="off">' : ''}
      <div class="dialog-actions">
        <button class="btn-ghost" data-dialog="cancel">Cancelar</button>
        <button class="btn-primary touch" data-dialog="ok"><span></span></button>
      </div>`;
    setText($('h3', d), title);
    setText($('p', d), body);
    setText($('[data-dialog="ok"] span', d), confirm);
    const field = $('input', d);
    const ok = $('[data-dialog="ok"]', d);
    if (field) {
      // Con un nombre ya puesto y seleccionado: aceptar sin más también vale.
      field.value = input;
      field.addEventListener('input', () => { ok.disabled = !field.value.trim(); });
      field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && field.value.trim()) { e.preventDefault(); ok.click(); }
      });
    }
    dialogConfirm = () => onConfirm(field ? field.value : undefined);
    S.dialog = true;
    el.dialogScrim.classList.add('open');
    if (field) setTimeout(() => { field.focus(); field.select(); }, 60);
    else ok.focus();
  }
  function closeDialog() {
    S.dialog = false;
    dialogConfirm = null;
    el.dialogScrim.classList.remove('open');
  }
  function onDialogClick(e) {
    if (e.target === el.dialogScrim) return closeDialog();
    const button = e.target.closest('[data-dialog]');
    if (!button) return;
    const confirm = button.dataset.dialog === 'ok' ? dialogConfirm : null;
    closeDialog();
    if (confirm) confirm();
  }

  // ---------------------------------------------------------------- cuerda de referencia (Karplus-Strong, como ReferenceTonePlayer)
  let audio = null, voice = null;
  function playTone(frequency) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      stopTone();
      const rate = audio.sampleRate, seconds = 1.6;
      const total = Math.floor(rate * seconds);
      const period = clamp(Math.floor(rate / frequency), 2, Math.floor(rate / 16));
      const ring = new Float32Array(period).map(() => Math.random() * 2 - 1);
      for (let i = 0; i < period; i++) ring[i] = (ring[i] + ring[(i + 1) % period]) * 0.5;
      const decay = 0.25 ** (1 / (seconds * frequency));
      const buffer = audio.createBuffer(1, total, rate);
      const data = buffer.getChannelData(0);
      let index = 0;
      for (let i = 0; i < total; i++) {
        const value = ring[index];
        ring[index] = (value + ring[(index + 1) % period]) * 0.5 * decay;
        index = (index + 1) % period;
        data[i] = value * (1 - i / total) * 0.55;
      }
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      gain.gain.value = 0.7;
      source.buffer = buffer;
      source.connect(gain).connect(audio.destination);
      source.start();
      voice = source;
    } catch (e) {
      voice = null;
    }
  }
  function stopTone() {
    if (voice) { try { voice.stop(); } catch (e) { /* ya terminó */ } }
    voice = null;
    S.soundingString = null;
  }

  // ================================================================= hojas modales
  const neonSrc = (icon) => `assets/neon/${icon}.png`;

  /**
   * El instrumento en grande (InstrumentGlyph.kt): tubo de neón en el modo oscuro y el
   * mismo dibujo a trazo en el claro, siempre del color del tema.
   */
  const instrumentGlyph = (icon) => (isDark()
    ? `<img src="${neonSrc(icon)}" alt="">`
    : lineIcon(icon, ''));

  function typeOptionsHTML(inst, selectedIndex) {
    return `<div class="options" role="radiogroup">${inst.types.map((type, i) => `
      <button class="option" role="radio" aria-checked="${i === selectedIndex}" data-type="${i}">
        <span class="o-main"><span class="o-title">${type.name}</span><span class="o-sub">${stringLabels(type.tunings[0], S.accidental)}</span></span>
        <span class="radio"></span>
      </button>`).join('')}</div>`;
  }

  function identifyHTML() {
    const inst = instrumentById(S.pick.inst);
    return `
      <div class="pick-head">
        <button class="neon spin" id="pickNeon" aria-label="${inst.name}">${instrumentGlyph(inst.icon)}</button>
        <div class="screen-title" id="pickName">${inst.name}</div>
        <div class="pick-sub">Elige el instrumento y su afinación</div>
      </div>
      <div class="sp-24"></div>
      <div class="section-label">ELIGE EL INSTRUMENTO A AFINAR</div>
      <div class="hint">Cada uno muestra sus cuerdas al aire en la afinación estándar.</div>
      <div class="sp-12"></div>
      <div class="options" role="radiogroup" id="instOptions">${INSTRUMENTS.map((i) => `
        <button class="option" role="radio" aria-checked="${i.id === inst.id}" data-inst="${i.id}">
          ${lineIcon(i.icon)}
          <span class="o-main"><span class="o-title">${i.name}</span><span class="o-sub">${stringLabels(i.types[0].tunings[0], S.accidental)}</span></span>
          <span class="o-count">${i.types.length > 1 ? `${i.types.length} tipos` : '1 tipo'}</span>
          <span class="radio"></span>
        </button>`).join('')}
      </div>
      <div class="sp-20"></div>
      <div id="pickTunings">${pickTuningsHTML(inst)}</div>
      <div class="sp-24"></div>
      <div class="caption" id="pickHint">${pickHint()}</div>
      <div class="sp-12"></div>
      <div class="btn-row">
        <button class="btn-secondary" data-act="close">Cancelar</button>
        <button class="btn-primary lg touch" data-act="accept">Aceptar</button>
      </div>`;
  }
  function pickTuningsHTML(inst) {
    if (inst.types.length < 2) return '';
    return `
      <div class="section-label">TIPO</div>
      <div class="hint">Cuántas cuerdas tiene el tuyo. Sus afinaciones están en el botón de abajo a la izquierda.</div>
      <div class="sp-12"></div>
      ${typeOptionsHTML(inst, S.pick.type)}`;
  }
  function pickHint() {
    const inst = instrumentById(S.pick.inst);
    const label = inst.types.length > 1 ? `${inst.name} · ${inst.types[S.pick.type].name}` : inst.name;
    return `Al aceptar verás la afinación de ${label}.`;
  }

  function openSheet() {
    S.sheet = 'identify';
    S.pick = S.instrument
      ? { inst: S.instrument.id, type: S.instrument.types.indexOf(currentType()) }
      : { inst: 'GUITAR', type: 0 };
    el.sheetBody.innerHTML = identifyHTML();
    el.sheetBody.scrollTop = 0;
    el.sheet.style.transform = '';
    el.scrim.classList.add('open');
    el.sheet.classList.add('open');
    fitPrimaryButton();
  }
  function closeSheet() {
    S.sheet = null;
    el.sheet.style.transform = '';
    el.scrim.classList.remove('open');
    el.sheet.classList.remove('open');
  }

  function onSheetClick(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const act = target.dataset.act;
    if (act === 'close') return closeSheet();
    if (act === 'accept') return acceptPick();

    if (target.id === 'pickNeon') return spin(target);

    if (target.dataset.inst) {
      if (S.pick.inst === target.dataset.inst) return;
      S.pick = { inst: target.dataset.inst, type: 0 };
      const inst = instrumentById(S.pick.inst);
      $$('#instOptions .option').forEach((o) => o.setAttribute('aria-checked', String(o.dataset.inst === inst.id)));
      const glyph = $('#pickNeon');
      glyph.style.opacity = '0';
      setTimeout(() => { glyph.innerHTML = instrumentGlyph(inst.icon); glyph.style.opacity = '1'; }, 170);
      glyph.setAttribute('aria-label', inst.name);
      setText($('#pickName'), inst.name);
      $('#pickTunings').innerHTML = pickTuningsHTML(inst);
      setText($('#pickHint'), pickHint());
      return;
    }

    if (target.dataset.type != null) {
      target.parentElement.querySelectorAll('.option').forEach((o) => o.setAttribute('aria-checked', String(o === target)));
      S.pick.type = Number(target.dataset.type);
      setText($('#pickHint'), pickHint());
    }
  }

  // Arrastrar la hoja hacia abajo para cerrarla.
  function setupDrag() {
    let startY = 0, lastY = 0, lastT = 0, velocity = 0, dragging = false;
    const scale = () => phoneScale || 1;
    el.dragZone.addEventListener('pointerdown', (e) => {
      if (!S.sheet) return;
      dragging = true;
      startY = lastY = e.clientY;
      lastT = performance.now();
      velocity = 0;
      el.sheet.classList.add('dragging');
      el.dragZone.setPointerCapture(e.pointerId);
    });
    el.dragZone.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      velocity = (e.clientY - lastY) / Math.max(now - lastT, 1);
      lastY = e.clientY; lastT = now;
      const dy = Math.max(0, (e.clientY - startY) / scale());
      el.sheet.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.sheet.classList.remove('dragging');
      const dy = (lastY - startY) / scale();
      if (dy > 110 || velocity > 0.8) closeSheet();
      else el.sheet.style.transform = '';
    };
    el.dragZone.addEventListener('pointerup', end);
    el.dragZone.addEventListener('pointercancel', end);
  }

  // ================================================================= aspecto (ThemeMode.kt)
  function toggleMode() {
    applyMode(isDark() ? 'light' : 'dark');
    if (S.sheet === 'identify') openSheet('identify');
  }

  function applyMode(key) {
    S.theme = key;
    const c = MODES[key];
    S.colors = c;
    const root = document.documentElement.style;
    root.setProperty('--accent', toHex(c.accent));
    root.setProperty('--accent-alt', toHex(c.accentAlt));
    root.setProperty('--on-accent', toHex(c.onAccent));
    root.setProperty('--bg', toHex(c.background));
    root.setProperty('--bg-deep', toHex(c.backgroundDeep));
    root.setProperty('--surface', toHex(c.surface));
    root.setProperty('--surface-high', toHex(c.surfaceHigh));
    root.setProperty('--text', toHex(c.textPrimary));
    root.setProperty('--muted', toHex(c.textMuted));
    root.setProperty('--display', toHex(c.display));
    root.setProperty('--display-frame', css(c.displayFrame));
    // El logo es el neón recortado en círculo en oscuro y el mismo dibujo a trazo en claro.
    $$('[data-logo]').forEach((img) => {
      img.src = isDark() ? 'assets/logo/logo_neon.png' : 'assets/logo/logo_line.png';
      img.parentElement.classList.toggle('line', !isDark());
    });
    renderAvatars();
    drawModeIcons();
    dials.chromatic.color = null;
    dials.instrument.color = null;
  }

  /** Sol o luna: dibuja el modo al que se va a cambiar (ThemeModeIcon en Buttons.kt). */
  function drawModeIcons() {
    const r = 10, fill = toHex(S.colors.accent);
    const dark = isDark();
    const sun = `<circle cx="10" cy="10" r="${r * 0.52}" fill="${fill}"/>` + [...Array(8)].map((_, i) => {
      const a = i * 45 * Math.PI / 180;
      const [dx, dy] = [Math.cos(a), Math.sin(a)];
      return `<line x1="${10 + dx * r * 0.72}" y1="${10 + dy * r * 0.72}" x2="${10 + dx * r}" y2="${10 + dy * r}" stroke="${fill}" stroke-width="1.8" stroke-linecap="round"/>`;
    }).join('');
    // La luna es el disco menos otro desplazado: con una máscara, no dos círculos sueltos.
    const moon = `
      <mask id="moonCut"><circle cx="10" cy="10" r="${r}" fill="#fff"/><circle cx="${10 + r * 0.42}" cy="${10 - r * 0.28}" r="${r}" fill="#000"/></mask>
      <circle cx="10" cy="10" r="${r}" fill="${fill}" mask="url(#moonCut)"/>`;
    $$('.mode-icon').forEach((svg, i) => { svg.innerHTML = dark ? sun : moon.replaceAll('moonCut', `moonCut${i}`); });
    $$('[data-toggle-theme]').forEach((b) => b.setAttribute('aria-label', dark ? 'Cambiar al modo claro' : 'Cambiar al modo oscuro'));
  }

  // Remolino al tocar el logo o un icono de neón (SpinOnTap.kt).
  function spin(node) {
    const turns = Number(node.dataset.turns || 0) + 1;
    node.dataset.turns = String(turns);
    node.style.transform = `rotate(${turns * 360}deg)`;
    node.classList.add('spinning');
    clearTimeout(node._spinTimer);
    node._spinTimer = setTimeout(() => node.classList.remove('spinning'), 700);
  }

  // El título de la cabecera también se reduce si no cabe ("Nueva afinación", "Violonchelo").
  function fitTitles() {
    $$('.inst-name').forEach((title) => {
      if (!title.clientWidth) return;
      let size = 22;
      title.style.fontSize = `${size}px`;
      while (title.scrollWidth > title.clientWidth && size > 16) {
        size -= 0.5;
        title.style.fontSize = `${size}px`;
      }
    });
  }

  // El texto del botón principal se reduce si no cabe (TextAutoSize.StepBased).
  function fitPrimaryButton() {
    $$('.btn-primary').forEach((btn) => {
      const label = btn.querySelector('span');
      if (!label || !btn.clientWidth) return;
      const available = btn.clientWidth - 32;
      let size = 16;
      label.style.fontSize = `${size}px`;
      while (label.scrollWidth > available && size > 10) {
        size -= 0.25;
        label.style.fontSize = `${size}px`;
      }
    });
  }

  // ================================================================= simulador
  const randomOffset = () => (Math.random() < 0.5 ? -1 : 1) * Math.round(14 + Math.random() * 24);

  function setSim(midi, cents) {
    sim.midi = clamp(midi, 23, 96);
    if (cents != null) sim.cents = clamp(Math.round(cents), -50, 50);
    sim.autoTune = null;
    renderSimNote();
    renderSimStrings();
  }
  function renderSimNote() {
    const n = noteName(sim.midi, S.accidental);
    setText($('#simNote'), n.label);
    setText($('#simHz'), formatHz(midiToFreq(sim.midi + sim.cents / 100, 440)));
    setText($('#simCents'), `${sim.cents > 0 ? '+' : ''}${Math.round(sim.cents)} ¢`);
    const slider = $('#simSlider');
    if (Number(slider.value) !== Math.round(sim.cents)) slider.value = String(Math.round(sim.cents));
  }
  function renderSimStrings() {
    const box = $('#simStrings');
    if (!S.instrument) { box.innerHTML = ''; return; }
    box.innerHTML = orderedStrings().map((s) => `
      <button class="sim-chip${sim.midi === s.midi ? ' on' : ''}" data-midi="${s.midi}"><small>${s.number}</small>${noteName(s.midi, S.accidental).label}</button>`).join('');
  }

  function setupSim() {
    $('#simOn').addEventListener('change', (e) => {
      sim.on = e.target.checked;
      setText($('#simOnLabel'), sim.on ? 'Sonando' : 'En silencio');
    });
    $('#simUp').addEventListener('click', () => setSim(sim.midi + 1));
    $('#simDown').addEventListener('click', () => setSim(sim.midi - 1));
    $('#simSlider').addEventListener('input', (e) => { sim.autoTune = null; sim.cents = Number(e.target.value); renderSimNote(); });
    $('#simTune').addEventListener('click', () => { sim.autoTune = { from: sim.cents, start: performance.now(), ms: 1800 }; });
    $('#simDetune').addEventListener('click', () => { sim.autoTune = null; sim.cents = randomOffset(); renderSimNote(); });
    $('#simStrings').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-midi]');
      if (chip) setSim(Number(chip.dataset.midi), randomOffset());
    });
  }
  function stepAutoTune(now) {
    if (!sim.autoTune) return;
    const t = clamp((now - sim.autoTune.start) / sim.autoTune.ms, 0, 1);
    const eased = 1 - (1 - t) ** 3;
    sim.cents = sim.autoTune.from * (1 - eased);
    if (t >= 1) { sim.cents = 0; sim.autoTune = null; }
    renderSimNote();
  }

  // ================================================================= ficha de tokens de los dos modos
  const TOKEN_ROLES = [
    ['background', 'background'], ['backgroundDeep', 'backgroundDeep'], ['surface', 'surface'],
    ['surfaceHigh', 'surfaceHigh'], ['textPrimary', 'textPrimary'], ['textMuted', 'textMuted'],
    ['accent', 'accent'], ['accentAlt', 'accentAlt'], ['onAccent', 'onAccent'], ['display', 'display'],
    ['inTune', 'inTune'], ['nearlyInTune', 'nearlyInTune'], ['outOfTune', 'outOfTune'],
  ];
  function renderTokenCards() {
    $$('[data-tokens]').forEach((host) => {
      const mode = MODES[host.dataset.tokens];
      host.innerHTML = TOKEN_ROLES.map(([name, key]) => `
        <div class="token"><i style="background:${toHex(mode[key])}"></i><span class="t-name">${name}</span><span class="t-hex">${toHex(mode[key])}</span></div>`).join('')
        + `<div class="token"><i style="background:${mode.glow ? 'var(--accent)' : 'transparent'}"></i><span class="t-name">glow</span><span class="t-hex">${mode.glow}</span></div>`;
    });
  }

  // ================================================================= teléfono a escala
  let phoneScale = 1;
  function fitPhone() {
    const phone = el.phone;
    const byHeight = (window.innerHeight - 32) / 804;
    const byWidth = (Math.min(window.innerWidth, document.documentElement.clientWidth) - 32) / 384;
    phoneScale = clamp(Math.min(byHeight, byWidth, 1), 0.55, 1);
    phone.style.transform = phoneScale < 1 ? `scale(${phoneScale})` : '';
    el.phoneSlot.style.width = `${384 * phoneScale}px`;
    el.phoneSlot.style.height = `${804 * phoneScale}px`;
  }

  function updateClock() {
    const d = new Date();
    setText(el.clock, `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`);
  }

  // ================================================================= arranque
  function init() {
    Object.assign(el, {
      phone: $('#phone'), phoneSlot: $('#phoneSlot'), clock: $('#clock'),
      chromaticScreen: $('#chromaticScreen'), instrumentScreen: $('#instrumentScreen'),
      statusChromatic: $('[data-status="chromatic"]'), statusInstrument: $('[data-status="instrument"]'),
      instName: $('#instName'), instAvatar: $('#instAvatar'),
      strings: $('#strings'), footerHint: $('#footerHint'),
      scrim: $('#scrim'), sheet: $('#sheet'), sheetBody: $('#sheetBody'), dragZone: $('#dragZone'),
      statusAdd: $('[data-status="add"]'), addStrings: $('#addStrings'), addHint: $('#addHint'),
      saveBtn: $('#saveTuningBtn'), dialog: $('#dialog'), dialogScrim: $('#dialogScrim'),
    });
    el.screens = {
      chromatic: el.chromaticScreen, instrument: el.instrumentScreen, add: $('#addScreen'), saved: $('#savedScreen'),
      types: $('#typesScreen'),
    };
    dials = {
      chromatic: createVisor($('[data-visor="chromatic"]')),
      instrument: createVisor($('[data-visor="instrument"]')),
      add: createVisor($('[data-visor="add"]')),
    };
    stats = {
      chromatic: createStats($('[data-stats="chromatic"]')),
      instrument: createStats($('[data-stats="instrument"]')),
      add: createStats($('[data-stats="add"]')),
    };

    el.instrumentScreen.classList.remove('hidden-right');
    for (const layer of [el.instrumentScreen, el.screens.add, el.screens.saved, el.screens.types]) {
      Object.assign(layer.style, { transform: 'translateX(100%)', opacity: '0', pointerEvents: 'none' });
      layer.setAttribute('aria-hidden', 'true');
    }

    applyMode(S.theme);
    setAccidental('SHARPS');

    $$('.segmented button').forEach((b) => b.addEventListener('click', () => {
      setAccidental(b.dataset.acc);
      announceAccidental(b.dataset.acc);
    }));
    $$('[data-toggle-theme]').forEach((b) => b.addEventListener('click', toggleMode));
    $('#identifyBtn').addEventListener('click', openSheet);
    $('#backBtn').addEventListener('click', closeInstrumentTuning);
    $('#appLogo').addEventListener('click', (e) => spin(e.currentTarget));
    $$('[data-inst-avatar], #instAvatar').forEach((avatar) => avatar.addEventListener('click', (e) => spin(e.currentTarget)));
    $('#menuBtn').addEventListener('click', () => setMenu(!S.menuOpen));
    $('#menuScrim').addEventListener('click', () => setMenu(false));
    const menuActions = { add: openAdd, saved: openSaved, types: openTypes };
    $$('.menu-option').forEach((option) => option.addEventListener('click', () => menuActions[option.dataset.menu]()));
    $('#typesBody').addEventListener('click', onTypesClick);
    $$('[data-back]').forEach((button) => button.addEventListener('click', backToInstrument));
    el.saveBtn.addEventListener('click', openSaveDialog);
    $('#savedBody').addEventListener('click', onSavedClick);
    el.dialogScrim.addEventListener('click', onDialogClick);
    el.scrim.addEventListener('click', closeSheet);
    el.sheetBody.addEventListener('click', onSheetClick);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (S.dialog) closeDialog();
      else if (S.menuOpen) setMenu(false);
      else if (S.sheet) closeSheet();
      else if (S.mode === 'add' || S.mode === 'saved' || S.mode === 'types') backToInstrument();
      else if (S.mode === 'instrument') closeInstrumentTuning();
    });
    setupDrag();
    setupSim();
    renderSimNote();
    renderTokenCards();

    fitPhone();
    window.addEventListener('resize', () => { fitPhone(); fitPrimaryButton(); fitTitles(); });
    updateClock();
    setInterval(updateClock, 15000);
    if (document.fonts) document.fonts.ready.then(() => { fitPrimaryButton(); fitTitles(); });
    fitPrimaryButton();

    tick();
    setInterval(tick, 50);

    let last = performance.now();
    const t0 = last;
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      stepAutoTune(now);
      const scan = ((now - t0) % 3200) / 3200;
      const sliding = now < S.transitionUntil;
      const showing = (mode) => S.mode === mode || (sliding && S.transitionFrom === mode);
      if (showing('chromatic')) renderChromatic(dt, scan);
      if (S.instrument && showing('instrument')) renderInstrument(dt, scan);
      if (S.add && showing('add')) renderAdd(dt, scan);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  init();
})();
