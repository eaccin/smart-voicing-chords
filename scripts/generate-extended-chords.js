#!/usr/bin/env node
// Generates guitar + piano voicing data for: 7#9, 7b13, 7#11, 7b9

const rootNotes = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const rootPCs   = [ 0,  1,   2,  3,   4,  5,  6,   7,  8,   9, 10,  11];

// String open pitch classes: [str6(E), str5(A), str4(D), str3(G), str2(B), str1(E)]
const strPC = [4, 9, 2, 7, 11, 4];

// Get fret number for a given note on a string
// chooses low (0-11) or high (12-23) octave based on contextFret proximity
function getFret(rootPC, interval, stringIdx, contextFret) {
  const notePC = (rootPC + interval) % 12;
  let lo = (notePC - strPC[stringIdx] + 12) % 12;
  let hi = lo + 12;
  if (contextFret === undefined) return lo === 0 ? hi : lo; // prefer non-open for closed shapes
  return Math.abs(lo - contextFret) <= Math.abs(hi - contextFret) ? lo : hi;
}

// Build a voicing given a list of [stringIdx, interval, forceOctave] triples
// forceOctave: 0=low, 1=high, undefined=auto (based on anchor)
function buildVoicing(rootPC, strings, intervals, anchorStringIdx) {
  const positions = [-1, -1, -1, -1, -1, -1];
  const anchorIdx = strings.indexOf(anchorStringIdx);
  const anchorFret = anchorIdx >= 0
    ? (() => {
        const lo = (((rootPC + intervals[anchorIdx]) % 12) - strPC[anchorStringIdx] + 12) % 12;
        return lo === 0 ? lo + 12 : lo;
      })()
    : 5; // default context
  for (let i = 0; i < strings.length; i++) {
    positions[strings[i]] = getFret(rootPC, intervals[i], strings[i], anchorFret);
  }
  return positions;
}

// ──────────────────────────────────────────────────────────────
// CHORD TYPE DEFINITIONS
// Each chord type has: suffix, labelFn, intervals, and voicing templates
// Template: { strings: [s0..sN], intervals: [i0..iN], anchorStr, nameFn }
// intervals are semitones: 0=root, 4=M3, 7=P5, 10=b7, then extension
// ──────────────────────────────────────────────────────────────

const chordTypes = [
  {
    suffix: "7#9",
    labelFn: (r) => r + "7#9",
    // intervals: root=0, M3=4, P5=7, b7=10, #9=3 (pitch class of 15%12)
    templates: [
      // Shape 1: A-string root, 4 strings, no 5th (classic jazz voicing)
      { strings: [1,2,3,4], intervals: [0,4,10,3], anchorStr: 1, name: "A-str compact" },
      // Shape 2: A-string root, 5 strings with 5th via barre
      { strings: [1,2,3,4,5], intervals: [0,7,10,3,7], anchorStr: 1, name: "A-str barre" },
      // Shape 3: E-string root, barre, #9 on str1 (the Hendrix barre shape)
      { strings: [0,1,2,3,4,5], intervals: [0,7,10,4,7,3], anchorStr: 0, name: "E-str full" },
      // Shape 4: Rootless upper 4 strings (jazz chord-melody)
      { strings: [2,3,4,5], intervals: [10,4,7,3], anchorStr: 3, name: "Rootless upper" },
      // Shape 5: D-string root, 4 strings
      { strings: [2,3,4,5], intervals: [0,4,10,3], anchorStr: 2, name: "D-str" },
      // Shape 6: A-string root + str1 M3 double
      { strings: [1,2,3,4,5], intervals: [0,4,10,3,4], anchorStr: 1, name: "A-str ext" },
    ],
  },
  {
    suffix: "7b13",
    labelFn: (r) => r + "7b13",
    // intervals: root=0, M3=4, P5=7, b7=10, b13=8
    templates: [
      // Shape 1: A-string root, no 5th, b13 on str2
      { strings: [1,2,3,4], intervals: [0,4,10,8], anchorStr: 1, name: "A-str compact" },
      // Shape 2: A-string root, with 5th and b13
      { strings: [1,2,3,4,5], intervals: [0,7,10,8,0], anchorStr: 1, name: "A-str barre" },
      // Shape 3: E-string root, b13 on str1
      { strings: [0,1,2,3,4,5], intervals: [0,7,10,4,7,8], anchorStr: 0, name: "E-str full" },
      // Shape 4: Rootless, b7 + M3 + b13
      { strings: [2,3,4,5], intervals: [10,4,7,8], anchorStr: 3, name: "Rootless upper" },
      // Shape 5: D-string root, 4 strings
      { strings: [2,3,4,5], intervals: [0,4,10,8], anchorStr: 2, name: "D-str" },
      // Shape 6: A-string root, b13 on str1
      { strings: [1,2,3,4,5], intervals: [0,4,10,8,4], anchorStr: 1, name: "A-str ext" },
    ],
  },
  {
    suffix: "7#11",
    labelFn: (r) => r + "7#11",
    // intervals: root=0, M3=4, P5=7, b7=10, #11=6
    templates: [
      // Shape 1: A-string root, no 5th, #11 on str2
      { strings: [1,2,3,4], intervals: [0,4,10,6], anchorStr: 1, name: "A-str compact" },
      // Shape 2: A-string root with 5th
      { strings: [1,2,3,4,5], intervals: [0,7,10,6,0], anchorStr: 1, name: "A-str barre" },
      // Shape 3: E-string root full
      { strings: [0,1,2,3,4,5], intervals: [0,7,10,4,6,4], anchorStr: 0, name: "E-str full" },
      // Shape 4: Rootless upper
      { strings: [2,3,4,5], intervals: [10,4,6,4], anchorStr: 3, name: "Rootless upper" },
      // Shape 5: D-string root
      { strings: [2,3,4,5], intervals: [0,4,10,6], anchorStr: 2, name: "D-str" },
      // Shape 6: A-string ext
      { strings: [1,2,3,4,5], intervals: [0,4,6,10,4], anchorStr: 1, name: "A-str ext" },
    ],
  },
  {
    suffix: "7b9",
    labelFn: (r) => r + "7b9",
    // intervals: root=0, M3=4, P5=7, b7=10, b9=1
    templates: [
      // Shape 1: A-string root, no 5th
      { strings: [1,2,3,4], intervals: [0,4,10,1], anchorStr: 1, name: "A-str compact" },
      // Shape 2: A-string root with 5th
      { strings: [1,2,3,4,5], intervals: [0,7,10,1,0], anchorStr: 1, name: "A-str barre" },
      // Shape 3: E-string root full
      { strings: [0,1,2,3,4,5], intervals: [0,7,10,4,7,1], anchorStr: 0, name: "E-str full" },
      // Shape 4: Rootless upper
      { strings: [2,3,4,5], intervals: [10,4,7,1], anchorStr: 3, name: "Rootless upper" },
      // Shape 5: D-string root
      { strings: [2,3,4,5], intervals: [0,4,10,1], anchorStr: 2, name: "D-str" },
      // Shape 6: A-str ext with doubled root
      { strings: [1,2,3,4,5], intervals: [0,4,10,1,7], anchorStr: 1, name: "A-str ext" },
    ],
  },
  {
    suffix: "maj9",
    labelFn: (r) => r + "maj9",
    // intervals: root=0, M3=4, P5=7, M7=11, M9=2 (pitch class of 14)
    templates: [
      // Shape 1: A-string root, no 5th (compact jazz voicing)
      { strings: [1,2,3,4],   intervals: [0,4,11,2],      anchorStr: 1, name: "A-str compact" },
      // Shape 2: A-string root, with P5 via barre
      { strings: [1,2,3,4,5], intervals: [0,7,11,2,7],    anchorStr: 1, name: "A-str barre" },
      // Shape 3: E-string root, full barre + M9 on str1
      { strings: [0,1,2,3,4,5], intervals: [0,7,11,4,7,2], anchorStr: 0, name: "E-str full" },
      // Shape 4: Rootless upper 4 strings (jazz chord-melody)
      { strings: [2,3,4,5],   intervals: [11,4,7,2],      anchorStr: 3, name: "Rootless upper" },
      // Shape 5: D-string root, 4 strings
      { strings: [2,3,4,5],   intervals: [0,4,11,2],      anchorStr: 2, name: "D-str" },
      // Shape 6: A-string root, M3 doubled on str1
      { strings: [1,2,3,4,5], intervals: [0,4,11,2,4],    anchorStr: 1, name: "A-str ext" },
    ],
  },
];

// ──────────────────────────────────────────────────────────────
// Generate guitar voicing TypeScript
// ──────────────────────────────────────────────────────────────

function inferFingers(positions) {
  const used = positions.map((f, i) => ({ f, i })).filter(x => x.f >= 0);
  if (used.length === 0) return positions.map(() => 0);
  const minFret = Math.min(...used.map(x => x.f));
  const fingers = positions.map(f => f < 0 ? 0 : 0);
  // Simple heuristic: assign fingers 1-4 in ascending fret order
  const nonOpen = used.filter(x => x.f > 0).sort((a, b) => a.f - b.f || b.i - a.i);
  const fretGroups = {};
  for (const x of nonOpen) {
    if (!fretGroups[x.f]) fretGroups[x.f] = [];
    fretGroups[x.f].push(x.i);
  }
  const uniqueFrets = Object.keys(fretGroups).map(Number).sort((a,b)=>a-b);
  let fingerNum = 1;
  for (const f of uniqueFrets) {
    const strs = fretGroups[f];
    for (const s of strs) fingers[s] = fingerNum;
    if (fingerNum < 4) fingerNum++;
  }
  return fingers;
}

function detectBarre(positions, fingers) {
  // Find if a single finger covers multiple strings at same fret
  const barres = [];
  const fingerFrets = {};
  for (let i = 0; i < 6; i++) {
    if (positions[i] >= 1 && fingers[i] === 1) {
      if (!fingerFrets[positions[i]]) fingerFrets[positions[i]] = [];
      fingerFrets[positions[i]].push(i);
    }
  }
  for (const [fret, strs] of Object.entries(fingerFrets)) {
    if (strs.length >= 2) {
      barres.push({ fret: Number(fret), fromString: Math.max(...strs) + 1, toString: Math.min(...strs) + 1 });
    }
  }
  return barres;
}

function voicingName(template, rootNote, rootPC) {
  const minFret = Math.max(...template.map(f => f >= 0 ? f : 0).filter(f => f > 0));
  const maxFret = Math.max(...template.filter(f => f >= 0));
  const anchorFret = template[template.indexOf(Math.max(...template.filter((f,i) => f >= 0)))];
  // derive position from anchor string's fret
  const usedFrets = template.filter(f => f > 0);
  if (usedFrets.length === 0) return "Open";
  const centerFret = Math.round(usedFrets.reduce((a,b) => a+b, 0) / usedFrets.length);
  if (centerFret <= 3) return centerFret <= 1 ? "Open pos" : `Pos ${centerFret}`;
  return `Pos ${centerFret}`;
}

function generateGuitarTS(chordType) {
  const lines = [];
  lines.push(`  // ── ${chordType.suffix.toUpperCase()} ──`);

  for (let ki = 0; ki < rootNotes.length; ki++) {
    const rootNote = rootNotes[ki];
    const rootPC = rootPCs[ki];
    const label = chordType.labelFn(rootNote);
    lines.push(`  { key: "${rootNote}", suffix: "${chordType.suffix}", label: "${label}", voicings: [`);

    for (let ti = 0; ti < chordType.templates.length; ti++) {
      const tmpl = chordType.templates[ti];
      const pos = buildVoicing(rootPC, tmpl.strings, tmpl.intervals, tmpl.anchorStr);

      // Validate: all non-muted strings should have valid frets 0-20
      const valid = pos.every(f => f === -1 || (f >= 0 && f <= 20));
      if (!valid) {
        // Try with different octave selection by flipping anchor octave preference
        // Just skip if invalid
        continue;
      }

      const fingers = inferFingers(pos);
      const barres = detectBarre(pos, fingers);

      const usedFrets = pos.filter(f => f > 0);
      const centerFret = usedFrets.length > 0
        ? Math.round(usedFrets.reduce((a,b)=>a+b,0)/usedFrets.length)
        : 0;
      const nameParts = [`Pos ${centerFret}`, `v${ti+1}`];
      const vName = centerFret <= 1 ? `Open v${ti+1}` : `Pos ${centerFret} v${ti+1}`;

      const posStr = `[${pos.join(",")}]`;
      const fingStr = `[${fingers.join(",")}]`;

      let barrePart = "";
      if (barres.length > 0) {
        barrePart = `, [${barres.map(b => `barre(${b.fret},${b.fromString},${b.toString})`).join(", ")}]`;
      }

      lines.push(`    v("${vName}", ${posStr}, ${fingStr}${barrePart}),`);
    }

    lines.push(`  ]},`);
  }
  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────────
// Generate piano voicing TypeScript
// ──────────────────────────────────────────────────────────────

// Piano chord: notes as MIDI intervals from root (C4=60)
const NOTE_MAP = {
  "C":60,"C#":61,"Db":61,"D":62,"D#":63,"Eb":63,
  "E":64,"F":65,"F#":66,"Gb":66,"G":67,"G#":68,"Ab":68,
  "A":69,"A#":70,"Bb":70,"B":71
};

function pianoVoicings(rootNote, intervals) {
  const base = NOTE_MAP[rootNote] ?? 60;
  const notes = intervals.map(i => base + i);
  return notes;
}

function generatePianoTS(chordType, pianoIntervals, inversions) {
  const lines = [];
  lines.push(`  // === ${chordType.suffix.toUpperCase()} ===`);
  for (const rootNote of rootNotes) {
    const label = chordType.labelFn(rootNote);
    const voicings = [];
    // Root position
    const rootNotes_ = pianoVoicings(rootNote, pianoIntervals);
    voicings.push(`pv("Root", n("${rootNote}", ${pianoIntervals.join(", ")}))`);
    // Inversions
    for (let inv = 0; inv < inversions.length; inv++) {
      voicings.push(`pv("${inv+1}st Inv", n("${rootNote}", ${inversions[inv].join(", ")}))`);
    }
    lines.push(`  { key: "${rootNote}", suffix: "${chordType.suffix}", label: "${label}", voicings: [${voicings.join(", ")}] },`);
  }
  return lines.join("\n");
}

// Piano interval definitions (semitones from root, in voiced order)
const pianoIntervalDefs = {
  // ── Altered dominants (also have guitar templates above) ──
  "7#9": {
    root: [0, 4, 10, 15],   // R, M3, b7, #9
    inv1: [4, 10, 15, 12],  // M3, b7, #9, R+oct
    inv2: [10, 15, 12, 16], // b7, #9, R+oct, M3+oct
  },
  "7b13": {
    root: [0, 4, 10, 20],   // R, M3, b7, b13
    inv1: [4, 10, 20, 12],  // M3, b7, b13, R+oct
    inv2: [10, 20, 12, 16], // b7, b13, R+oct, M3+oct
  },
  "7#11": {
    root: [0, 4, 10, 18],   // R, M3, b7, #11
    inv1: [4, 10, 18, 12],  // M3, b7, #11, R+oct
    inv2: [10, 18, 12, 16], // b7, #11, R+oct, M3+oct
  },
  "7b9": {
    root: [0, 4, 10, 13],   // R, M3, b7, b9
    inv1: [4, 10, 13, 12],  // M3, b7, b9, R+oct
    inv2: [10, 13, 12, 16], // b7, b9, R+oct, M3+oct
  },
  // ── Piano-only extensions (guitar already has these) ──
  "9": {
    root: [0, 4, 10, 14],   // R, M3, b7, M9
    inv1: [4, 10, 14, 12],  // M3, b7, M9, R+oct
    inv2: [10, 14, 12, 16], // b7, M9, R+oct, M3+oct
  },
  "maj9": {
    root: [0, 4, 11, 14],   // R, M3, M7, M9
    inv1: [4, 11, 14, 12],  // M3, M7, M9, R+oct
    inv2: [11, 14, 12, 16], // M7, M9, R+oct, M3+oct
  },
  "m9": {
    root: [0, 3, 10, 14],   // R, m3, b7, M9
    inv1: [3, 10, 14, 12],  // m3, b7, M9, R+oct
    inv2: [10, 14, 12, 15], // b7, M9, R+oct, m3+oct
  },
  "11": {
    root: [0, 4, 10, 17],   // R, M3, b7, P11
    inv1: [4, 10, 17, 12],  // M3, b7, P11, R+oct
    inv2: [10, 17, 12, 16], // b7, P11, R+oct, M3+oct
  },
  "13": {
    root: [0, 4, 10, 21],   // R, M3, b7, M13
    inv1: [4, 10, 21, 12],  // M3, b7, M13, R+oct
    inv2: [10, 21, 12, 16], // b7, M13, R+oct, M3+oct
  },
};

// ──────────────────────────────────────────────────────────────
// Output
// ──────────────────────────────────────────────────────────────

console.log("// ═══════════════════════════════════════════════════════");
console.log("// GUITAR VOICINGS - paste into chords.ts before closing ]");
console.log("// ═══════════════════════════════════════════════════════\n");

for (const ct of chordTypes) {
  console.log(generateGuitarTS(ct));
  console.log();
}

console.log("\n// ════════════════════════════════════════════════════════");
console.log("// PIANO VOICINGS - paste into pianoChords.ts before closing ]");
console.log("// ════════════════════════════════════════════════════════\n");

// All suffixes that need piano voicings (chordTypes covers guitar+piano,
// pianoOnlySuffixes covers suffixes guitar already has but piano doesn't)
const allPianoSuffixes = [
  // From chordTypes (guitar+piano): 7#9, 7b13, 7#11, 7b9, maj9
  ...chordTypes.map(ct => ct.suffix),
  // Piano-only gaps: 9, m9, 11, 13
  ...["9", "m9", "11", "13"],
];

// Label helpers for piano-only suffixes
const pianoOnlyLabelFns = {
  "9":   (r) => r + "9",
  "m9":  (r) => r + "m9",
  "11":  (r) => r + "11",
  "13":  (r) => r + "13",
};

for (const suffix of allPianoSuffixes) {
  const def = pianoIntervalDefs[suffix];
  const labelFn = chordTypes.find(ct => ct.suffix === suffix)?.labelFn
    ?? pianoOnlyLabelFns[suffix]
    ?? ((r) => r + suffix);
  const lines = [];
  lines.push(`  // === ${suffix.toUpperCase()} ===`);
  for (const rootNote of rootNotes) {
    const label = labelFn(rootNote);
    const { root, inv1, inv2 } = def;
    lines.push(`  { key: "${rootNote}", suffix: "${suffix}", label: "${label}", voicings: [pv("Root", n("${rootNote}", ${root.join(", ")})), pv("1st Inv", n("${rootNote}", ${inv1.join(", ")})), pv("2nd Inv", n("${rootNote}", ${inv2.join(", ")}))] },`);
  }
  console.log(lines.join("\n"));
  console.log();
}

console.log(`
// ════════════════════════════════════════════════════════
// UPDATE suffixes array in chords.ts — add after "13":
// "maj9", "7#9", "7b9", "7#11", "7b13"
//
// UPDATE suffixLabels in chords.ts:
// "maj9": "maj9", "7#9": "7#9", "7b9": "7b9", "7#11": "7#11", "7b13": "7b13"
//
// UPDATE pianoSuffixes array in pianoChords.ts — add after "sus2":
// "9", "maj9", "m9", "11", "13", "7#9", "7b9", "7#11", "7b13"
//
// UPDATE pianoSuffixLabels in pianoChords.ts:
// "9": "9", "maj9": "maj9", "m9": "m9", "11": "11", "13": "13",
// "7#9": "7#9", "7b9": "7b9", "7#11": "7#11", "7b13": "7b13"
//
// UPDATE PIANO_CHORD_FORMULAS in src/lib/music.ts — add:
// "9": ["1","3","b7","9"], "maj9": ["1","3","7","9"],
// "m9": ["1","b3","b7","9"], "11": ["1","3","b7","11"],
// "13": ["1","3","b7","13"], "7#9": ["1","3","b7","#9"],
// "7b9": ["1","3","b7","b9"], "7#11": ["1","3","b7","#11"],
// "7b13": ["1","3","b7","b13"]
// ════════════════════════════════════════════════════════
`);
