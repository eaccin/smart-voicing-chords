import type { ChordVoicing } from "@/data/chords";

// ── CAGED system — 5 movable major-chord shapes ──────────────────────────────
// Each shape is the "open" voicing of its namesake chord (C, A, G, E, D).
// Barring the shape up the neck transposes it into any other major chord.
// For a target chord, the 5 shapes combine to cover the whole fretboard.

export type CagedShape = "C" | "A" | "G" | "E" | "D";
export const CAGED_ORDER: readonly CagedShape[] = ["C", "A", "G", "E", "D"];

export const NOTE_NAMES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"] as const;
export const ROOT_PITCH: Record<string, number> = {
  C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,
};

// Standard tuning, low-to-high: E A D G B E → pitch classes
const OPEN_STRING_PITCHES = [4, 9, 2, 7, 11, 4];

interface CagedShapeDef {
  shape: CagedShape;
  /** Pitch class of the open chord's root (e.g. C=0, E=4, G=7, A=9, D=2). */
  rootPitch: number;
  /** Positions for each string (idx 0=low E ... 5=high e) relative to the barre fret.
   *  -1 = muted; 0 = on barre fret; N = N frets above barre. */
  template: readonly number[];
  /** Fingers when barred at fret >= 1 (0 = none/open, 1-4 = finger number). */
  barredFingers: readonly number[];
  /** Fingers when played in open form (barre fret 0). */
  openFingers: readonly number[];
  /** Barre to render when barred at fret >= 1 (undefined = no full barre). */
  barre?: { fromString: number; toString: number };
  /** Human-readable description of where the root sits. */
  rootLocation: string;
  /** Short educational blurb about playing the shape. */
  description: string;
  /** Rough difficulty from 1 (easy) to 5 (hard). */
  difficulty: number;
}

/** The 5 CAGED shape definitions. */
export const CAGED_SHAPES: Record<CagedShape, CagedShapeDef> = {
  C: {
    shape: "C",
    rootPitch: 0,
    template: [-1, 3, 2, 0, 1, 0],
    barredFingers: [0, 4, 3, 1, 2, 1],
    openFingers: [0, 3, 2, 0, 1, 0],
    barre: { fromString: 3, toString: 1 },
    rootLocation: "Root on 5th string",
    description:
      "The C shape has its root on the 5th string. Barred up the neck it's one of the hardest CAGED shapes — your fingers stretch across four frets, so many players use it for arpeggios or partial voicings rather than full barre.",
    difficulty: 5,
  },
  A: {
    shape: "A",
    rootPitch: 9,
    template: [-1, 0, 2, 2, 2, 0],
    barredFingers: [0, 1, 3, 3, 3, 1],
    openFingers: [0, 0, 1, 2, 3, 0],
    barre: { fromString: 5, toString: 1 },
    rootLocation: "Root on 5th string",
    description:
      "The A shape is a workhorse barre chord. Barre with the index finger and mini-barre strings 2–4 with the ring finger. The root is on the 5th string at the barre.",
    difficulty: 3,
  },
  G: {
    shape: "G",
    rootPitch: 7,
    template: [3, 2, 0, 0, 0, 3],
    barredFingers: [3, 2, 1, 1, 1, 4],
    openFingers: [2, 1, 0, 0, 0, 3],
    // G shape is rarely full-barred — encoded as fingers only when moved.
    rootLocation: "Roots on 6th and 1st strings",
    description:
      "The G shape has two roots — one in the bass (6th string) and one at the top (1st string). Rarely played as a full barre chord (the stretch is huge); more often used for arpeggios and to connect the C and E shapes.",
    difficulty: 5,
  },
  E: {
    shape: "E",
    rootPitch: 4,
    template: [0, 2, 2, 1, 0, 0],
    barredFingers: [1, 3, 4, 2, 1, 1],
    openFingers: [0, 2, 3, 1, 0, 0],
    barre: { fromString: 6, toString: 1 },
    rootLocation: "Root on 6th string",
    description:
      "The E shape is the most common barre chord. Barre across all six strings with the index finger and build an 'E major' shape on top. Strong bass root on the 6th string.",
    difficulty: 2,
  },
  D: {
    shape: "D",
    rootPitch: 2,
    template: [-1, -1, 0, 2, 3, 2],
    barredFingers: [0, 0, 1, 2, 4, 3],
    openFingers: [0, 0, 0, 1, 3, 2],
    rootLocation: "Root on 4th string",
    description:
      "The D shape has its root on the 4th string — a high, bright voicing. When moved up the neck it uses only the top four strings, so mute strings 5 and 6 with your thumb or an unused finger.",
    difficulty: 4,
  },
};

/** Barre fret needed to play `targetKey` with the given shape (0 = open form). */
export function barreFretForShape(shape: CagedShape, targetKey: string): number {
  const targetPitch = ROOT_PITCH[targetKey] ?? 0;
  const shapePitch = CAGED_SHAPES[shape].rootPitch;
  return ((targetPitch - shapePitch) + 12) % 12;
}

/** Build a playable ChordVoicing for `shape` barred at `barreFret` (0 = open). */
export function buildCagedVoicing(shape: CagedShape, barreFret: number): ChordVoicing {
  const def = CAGED_SHAPES[shape];
  const positions = def.template.map(p => (p === -1 ? -1 : p + barreFret));
  const fingers = (barreFret === 0 ? def.openFingers : def.barredFingers) as number[];
  const barres = barreFret > 0 && def.barre
    ? [{ fret: barreFret, fromString: def.barre.fromString, toString: def.barre.toString }]
    : undefined;
  const played = positions.filter(p => p > 0);
  const baseFret = played.length > 0 ? Math.min(...played) : 1;
  return {
    name: barreFret === 0 ? `${shape} (open)` : `${shape} shape — barre ${barreFret}`,
    positions: positions as number[],
    fingers,
    barres,
    baseFret,
  };
}

export interface CagedPosition {
  shape: CagedShape;
  barreFret: number;
  voicing: ChordVoicing;
}

/** All 5 CAGED positions for `targetKey`, ordered by barre fret ascending. */
export function cagedPositionsForKey(targetKey: string): CagedPosition[] {
  return CAGED_ORDER.map(shape => {
    const barreFret = barreFretForShape(shape, targetKey);
    return { shape, barreFret, voicing: buildCagedVoicing(shape, barreFret) };
  }).sort((a, b) => a.barreFret - b.barreFret);
}

/** Compute the fretted notes of a voicing for fretboard visualization. */
export interface ShapeFretDot {
  stringIdx: number;  // 0 = low E, 5 = high e
  fret: number;
  isRoot: boolean;
  noteName: string;
}

export function shapeFretDots(voicing: ChordVoicing, rootPitch: number): ShapeFretDot[] {
  return voicing.positions.flatMap((pos, idx) => {
    if (pos < 0) return [];
    const pc = (OPEN_STRING_PITCHES[idx] + pos) % 12;
    return [{
      stringIdx: idx,
      fret: pos,
      isRoot: pc === rootPitch,
      noteName: NOTE_NAMES[pc],
    }];
  });
}

/** All pitch-class chord tones of a major chord across the whole neck
 *  (for dimmed "background" dots showing other CAGED positions). */
export function allChordToneDots(
  rootKey: string,
  numFrets = 15,
): Array<{ stringIdx: number; fret: number; isRoot: boolean; noteName: string }> {
  const rootPitch = ROOT_PITCH[rootKey] ?? 0;
  const chordPCs = new Set([0, 4, 7].map(i => (rootPitch + i) % 12));
  const dots: Array<{ stringIdx: number; fret: number; isRoot: boolean; noteName: string }> = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= numFrets; f++) {
      const pc = (OPEN_STRING_PITCHES[s] + f) % 12;
      if (chordPCs.has(pc)) {
        dots.push({
          stringIdx: s,
          fret: f,
          isRoot: pc === rootPitch,
          noteName: NOTE_NAMES[pc],
        });
      }
    }
  }
  return dots;
}

/** 12 practical roots for the key selector (no double-flats/sharps). */
export const PLAYABLE_ROOTS = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"] as const;
