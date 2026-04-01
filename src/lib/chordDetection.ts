/**
 * Chord detection from guitar fret positions.
 * Analyzes pitch classes and identifies chord quality, extensions, inversions, and slash chords.
 */

// Standard tuning MIDI: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_NAMES_FLAT  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Preferred spelling per pitch class for chord roots
const PREFERRED_ROOT: Record<number, string> = {
  0: "C", 1: "C#", 2: "D", 3: "Eb", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B",
};

function mod12(n: number) {
  return ((n % 12) + 12) % 12;
}

/** Convert fret positions to MIDI notes (skip muted = -1) */
export function positionsToMidi(positions: number[]): number[] {
  const notes: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (positions[i] >= 0) {
      notes.push(OPEN_STRING_MIDI[i] + positions[i]);
    }
  }
  return notes;
}

/** Get unique pitch classes from MIDI notes, sorted */
function getPitchClasses(midi: number[]): number[] {
  const pcs = new Set(midi.map(m => mod12(m)));
  return [...pcs].sort((a, b) => a - b);
}

/** Get the bass note (lowest pitched) */
function getBassNote(midi: number[]): number {
  return mod12(Math.min(...midi));
}

// Interval sets for chord qualities (intervals from root in semitones)
interface ChordTemplate {
  name: string;       // suffix displayed
  intervals: number[]; // required intervals from root
  optional?: number[]; // optional intervals
  priority: number;    // lower = higher priority match
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  // Triads
  { name: "", intervals: [0, 4, 7], priority: 10 },
  { name: "m", intervals: [0, 3, 7], priority: 10 },
  { name: "dim", intervals: [0, 3, 6], priority: 12 },
  { name: "aug", intervals: [0, 4, 8], priority: 12 },
  { name: "sus4", intervals: [0, 5, 7], priority: 11 },
  { name: "sus2", intervals: [0, 2, 7], priority: 11 },
  
  // Sevenths
  { name: "maj7", intervals: [0, 4, 7, 11], priority: 5 },
  { name: "7", intervals: [0, 4, 7, 10], priority: 5 },
  { name: "m7", intervals: [0, 3, 7, 10], priority: 5 },
  { name: "m(maj7)", intervals: [0, 3, 7, 11], priority: 5 },
  { name: "dim7", intervals: [0, 3, 6, 9], priority: 6 },
  { name: "m7b5", intervals: [0, 3, 6, 10], priority: 6 },
  { name: "7sus4", intervals: [0, 5, 7, 10], priority: 6 },
  { name: "7sus2", intervals: [0, 2, 7, 10], priority: 6 },
  
  // Sixths
  { name: "6", intervals: [0, 4, 7, 9], priority: 7 },
  { name: "m6", intervals: [0, 3, 7, 9], priority: 7 },
  
  // Ninths
  { name: "9", intervals: [0, 4, 7, 10, 14], priority: 3 },
  { name: "maj9", intervals: [0, 4, 7, 11, 14], priority: 3 },
  { name: "m9", intervals: [0, 3, 7, 10, 14], priority: 3 },
  { name: "add9", intervals: [0, 4, 7, 14], priority: 4 },
  { name: "m(add9)", intervals: [0, 3, 7, 14], priority: 4 },
  { name: "7b9", intervals: [0, 4, 7, 10, 13], priority: 3 },
  { name: "7#9", intervals: [0, 4, 7, 10, 15], priority: 3 },
  
  // Elevenths
  { name: "11", intervals: [0, 4, 7, 10, 14, 17], priority: 2 },
  { name: "m11", intervals: [0, 3, 7, 10, 14, 17], priority: 2 },
  { name: "7#11", intervals: [0, 4, 7, 10, 18], priority: 2 },
  
  // Thirteenths
  { name: "13", intervals: [0, 4, 7, 10, 21], priority: 1 },
  { name: "m13", intervals: [0, 3, 7, 10, 21], priority: 1 },
  { name: "maj13", intervals: [0, 4, 7, 11, 21], priority: 1 },
  
  // Altered dominants
  { name: "7b5", intervals: [0, 4, 6, 10], priority: 4 },
  { name: "7#5", intervals: [0, 4, 8, 10], priority: 4 },
  { name: "7alt", intervals: [0, 4, 8, 10, 13], priority: 2 },
  
  // Power chord
  { name: "5", intervals: [0, 7], priority: 15 },
];

function noteName(pc: number): string {
  return PREFERRED_ROOT[pc] ?? NOTE_NAMES_SHARP[pc];
}

interface ChordMatch {
  root: string;
  suffix: string;
  bass: string | null; // for slash chords
  label: string;
  score: number; // lower = better
}

function matchTemplate(
  pitchClasses: number[],
  rootPc: number,
  template: ChordTemplate
): number | null {
  // Convert template intervals to pitch classes relative to root
  const requiredPcs = template.intervals.map(i => mod12(rootPc + i));
  
  // All required pitch classes must be present
  for (const rpc of requiredPcs) {
    if (!pitchClasses.includes(rpc)) return null;
  }
  
  // Count unmatched pitch classes (notes in chord not in template)
  const templatePcSet = new Set(requiredPcs);
  if (template.optional) {
    template.optional.forEach(i => templatePcSet.add(mod12(rootPc + i)));
  }
  const unmatched = pitchClasses.filter(pc => !templatePcSet.has(pc)).length;
  
  // Score: priority + penalty for unmatched notes + bonus for exact match
  return template.priority + unmatched * 5 + (unmatched === 0 ? 0 : 2);
}

export interface DetectedChord {
  label: string;
  root: string;
  suffix: string;
  bass: string | null;
}

/**
 * Detect chord from guitar fret positions.
 * Returns multiple candidates sorted by likelihood.
 */
export function detectChordFromPositions(positions: number[]): DetectedChord[] {
  const midi = positionsToMidi(positions);
  if (midi.length < 2) return [];
  
  const pitchClasses = getPitchClasses(midi);
  const bassPc = getBassNote(midi);
  
  const matches: ChordMatch[] = [];
  
  // Try each pitch class as potential root
  for (let rootPc = 0; rootPc < 12; rootPc++) {
    if (!pitchClasses.includes(rootPc)) continue;
    
    for (const template of CHORD_TEMPLATES) {
      const score = matchTemplate(pitchClasses, rootPc, template);
      if (score === null) continue;
      
      const rootName = noteName(rootPc);
      const bassName = noteName(bassPc);
      const isInversion = bassPc !== rootPc;
      
      // Slight penalty for inversions
      const inversionPenalty = isInversion ? 3 : 0;
      
      const label = isInversion
        ? `${rootName}${template.name}/${bassName}`
        : `${rootName}${template.name}`;
      
      matches.push({
        root: rootName,
        suffix: template.name,
        bass: isInversion ? bassName : null,
        label,
        score: score + inversionPenalty,
      });
    }
  }
  
  // Sort by score (lower = better), deduplicate labels
  matches.sort((a, b) => a.score - b.score);
  
  const seen = new Set<string>();
  const unique: DetectedChord[] = [];
  for (const m of matches) {
    if (!seen.has(m.label)) {
      seen.add(m.label);
      unique.push({ label: m.label, root: m.root, suffix: m.suffix, bass: m.bass });
    }
    if (unique.length >= 8) break;
  }
  
  return unique;
}
