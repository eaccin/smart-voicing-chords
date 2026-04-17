/** Pitch class intervals from root for each scale type */
export const SCALE_INTERVALS: Record<string, number[]> = {
  major:            [0, 2, 4, 5, 7, 9, 11],
  minor:            [0, 2, 3, 5, 7, 8, 10],
  "harmonic minor": [0, 2, 3, 5, 7, 8, 11],
  "melodic minor":  [0, 2, 3, 5, 7, 9, 11],
  dorian:           [0, 2, 3, 5, 7, 9, 10],
  mixolydian:       [0, 2, 4, 5, 7, 9, 10],
  phrygian:         [0, 1, 3, 5, 7, 8, 10],
  "pent. major":    [0, 2, 4, 7, 9],
  "pent. minor":    [0, 3, 5, 7, 10],
  blues:            [0, 3, 5, 6, 7, 10],
  "whole tone":     [0, 2, 4, 6, 8, 10],
  diminished:       [0, 2, 3, 5, 6, 8, 9, 11],
};

export const SCALE_DEGREE_LABELS: Record<string, string[]> = {
  major:            ["1","2","3","4","5","6","7"],
  minor:            ["1","2","b3","4","5","b6","b7"],
  "harmonic minor": ["1","2","b3","4","5","b6","7"],
  "melodic minor":  ["1","2","b3","4","5","6","7"],
  dorian:           ["1","2","b3","4","5","6","b7"],
  mixolydian:       ["1","2","3","4","5","6","b7"],
  phrygian:         ["1","b2","b3","4","5","b6","b7"],
  "pent. major":    ["1","2","3","5","6"],
  "pent. minor":    ["1","b3","4","5","b7"],
  blues:            ["1","b3","4","b5","5","b7"],
  "whole tone":     ["1","2","3","#4","#5","b7"],
  diminished:       ["1","2","b3","4","b5","b6","6","7"],
};

export const SCALE_LABELS: Record<string, string> = {
  major:            "Major",
  minor:            "Minor",
  "harmonic minor": "Harmonic Minor",
  "melodic minor":  "Melodic Minor",
  dorian:           "Dorian",
  mixolydian:       "Mixolydian",
  phrygian:         "Phrygian",
  "pent. major":    "Pent. Major",
  "pent. minor":    "Pent. Minor",
  blues:            "Blues",
  "whole tone":     "Whole Tone",
  diminished:       "Diminished",
};

/** Chord tone intervals (semitones from root) for common suffixes */
const CHORD_TONES: Record<string, number[]> = {
  major:  [0, 4, 7],
  minor:  [0, 3, 7],
  "7":    [0, 4, 7, 10],
  "m7":   [0, 3, 7, 10],
  "maj7": [0, 4, 7, 11],
  "m7b5": [0, 3, 6, 10],
  "dim":  [0, 3, 6],
  "dim7": [0, 3, 6, 9],
  "aug":  [0, 4, 8],
  "sus2": [0, 2, 7],
  "sus4": [0, 5, 7],
  "6":    [0, 4, 7, 9],
  "m6":   [0, 3, 7, 9],
  "add9": [0, 2, 4, 7],
  "madd9": [0, 2, 3, 7],
  "9":    [0, 2, 4, 7, 10],
  "maj9": [0, 2, 4, 7, 11],
  "m9":   [0, 2, 3, 7, 10],
  "11":   [0, 4, 5, 7, 10],
  "13":   [0, 4, 7, 9, 10],
  "7#9":  [0, 3, 4, 7, 10],
  "7b9":  [0, 1, 4, 7, 10],
  "7#11": [0, 4, 6, 7, 10],
  "7b13": [0, 4, 7, 8, 10],
  "5":    [0, 7],
};

const ROOT_PITCHES: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8,
  Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

// Degree index within a scale for each semitone interval from scale root
const SCALE_DEGREE_MAPS: Record<string, Record<number, number>> = {
  major:            {0:0, 2:1, 4:2, 5:3, 7:4, 9:5, 11:6},
  minor:            {0:0, 2:1, 3:2, 5:3, 7:4, 8:5, 10:6},
  "harmonic minor": {0:0, 2:1, 3:2, 5:3, 7:4, 8:5, 11:6},
  "melodic minor":  {0:0, 2:1, 3:2, 5:3, 7:4, 9:5, 11:6},
  dorian:           {0:0, 2:1, 3:2, 5:3, 7:4, 9:5, 10:6},
  mixolydian:       {0:0, 2:1, 4:2, 5:3, 7:4, 9:5, 10:6},
  phrygian:         {0:0, 1:1, 3:2, 5:3, 7:4, 8:5, 10:6},
};

const DEGREE_NAMES = ["I","II","III","IV","V","VI","VII"];
const MINOR_SUFFIXES = new Set(["minor","m7","m9","m6","madd9","m7b5","dim","dim7"]);
const DIM_SUFFIXES   = new Set(["dim","dim7","m7b5"]);

// Canonical display keys (flats for Ab/Bb/Db/Eb/Gb)
const DISPLAY_KEYS = ["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const DISPLAY_KEY_PC: Record<string, number> = {
  C:0,Db:1,D:2,Eb:3,E:4,F:5,"F#":6,G:7,Ab:8,A:9,Bb:10,B:11,
};

export interface ScaleMatch {
  scaleKey: string;
  scaleType: string;
  degreeLabel: string; // e.g. "V", "i", "ii°"
}

/**
 * Returns list of scales (key + type) that contain this chord,
 * with the chord's roman-numeral function in each scale.
 * Checks major, minor, dorian, mixolydian across all 12 roots.
 */
export function getChordInScales(chordKey: string, suffix: string): ScaleMatch[] {
  const results: ScaleMatch[] = [];
  const chordPitch = ROOT_PITCHES[chordKey];
  if (chordPitch === undefined) return results;

  for (const scaleType of ["major", "minor", "harmonic minor", "melodic minor", "dorian", "mixolydian", "phrygian"]) {
    for (const scaleKey of DISPLAY_KEYS) {
      if (!chordFitsScale(chordKey, suffix, scaleKey, scaleType)) continue;
      const scalePitch = DISPLAY_KEY_PC[scaleKey];
      const interval = (chordPitch - scalePitch + 12) % 12;
      const degreeIdx = SCALE_DEGREE_MAPS[scaleType][interval];
      if (degreeIdx === undefined) continue;
      const numeral = DEGREE_NAMES[degreeIdx];
      const isMinor = MINOR_SUFFIXES.has(suffix);
      const isDim   = DIM_SUFFIXES.has(suffix);
      const base = isMinor ? numeral.toLowerCase() : numeral;
      results.push({ scaleKey, scaleType, degreeLabel: isDim ? base + "°" : base });
    }
  }
  return results;
}

/**
 * Returns true if the chord (key + suffix) fits within the given scale.
 * A chord fits if all its tones are pitch classes present in the scale.
 */
export function chordFitsScale(
  chordKey: string,
  suffix: string,
  scaleKey: string,
  scaleType: string,
): boolean {
  const scaleIntervals = SCALE_INTERVALS[scaleType];
  if (!scaleIntervals) return true;

  const scalePitch = ROOT_PITCHES[scaleKey];
  if (scalePitch === undefined) return true;

  const scalePCs = new Set(scaleIntervals.map(i => (scalePitch + i) % 12));

  const chordPitch = ROOT_PITCHES[chordKey];
  if (chordPitch === undefined) return true;

  const tones = CHORD_TONES[suffix] ?? [0, 4, 7]; // default to major triad
  return tones.every(t => scalePCs.has((chordPitch + t) % 12));
}
