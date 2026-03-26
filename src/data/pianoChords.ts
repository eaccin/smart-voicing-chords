export interface PianoChordVoicing {
  name: string;
  notes: number[]; // MIDI note numbers (e.g. 60 = C4)
}

export interface PianoChord {
  key: string;
  suffix: string;
  label: string;
  voicings: PianoChordVoicing[];
}

// MIDI note mapping: C4 = 60
const NOTE_MAP: Record<string, number> = {
  "C": 60, "C#": 61, "Db": 61, "D": 62, "D#": 63, "Eb": 63,
  "E": 64, "F": 65, "F#": 66, "Gb": 66, "G": 67, "G#": 68, "Ab": 68,
  "A": 69, "A#": 70, "Bb": 70, "B": 71,
};

function pv(name: string, notes: number[]): PianoChordVoicing {
  return { name, notes };
}

function n(root: string, ...intervals: number[]): number[] {
  const base = NOTE_MAP[root] ?? 60;
  return intervals.map(i => base + i);
}

const pianoChordData: PianoChord[] = [
  // === MAJOR ===
  { key: "C", suffix: "major", label: "C", voicings: [
    pv("Root", n("C", 0, 4, 7)),
    pv("1st Inv", n("C", 4, 7, 12)),
    pv("2nd Inv", n("C", 7, 12, 16)),
  ]},
  { key: "C#", suffix: "major", label: "C#", voicings: [
    pv("Root", n("C#", 0, 4, 7)),
    pv("1st Inv", n("C#", 4, 7, 12)),
    pv("2nd Inv", n("C#", 7, 12, 16)),
  ]},
  { key: "D", suffix: "major", label: "D", voicings: [
    pv("Root", n("D", 0, 4, 7)),
    pv("1st Inv", n("D", 4, 7, 12)),
    pv("2nd Inv", n("D", 7, 12, 16)),
  ]},
  { key: "Eb", suffix: "major", label: "Eb", voicings: [
    pv("Root", n("Eb", 0, 4, 7)),
    pv("1st Inv", n("Eb", 4, 7, 12)),
    pv("2nd Inv", n("Eb", 7, 12, 16)),
  ]},
  { key: "E", suffix: "major", label: "E", voicings: [
    pv("Root", n("E", 0, 4, 7)),
    pv("1st Inv", n("E", 4, 7, 12)),
    pv("2nd Inv", n("E", 7, 12, 16)),
  ]},
  { key: "F", suffix: "major", label: "F", voicings: [
    pv("Root", n("F", 0, 4, 7)),
    pv("1st Inv", n("F", 4, 7, 12)),
    pv("2nd Inv", n("F", 7, 12, 16)),
  ]},
  { key: "F#", suffix: "major", label: "F#", voicings: [
    pv("Root", n("F#", 0, 4, 7)),
    pv("1st Inv", n("F#", 4, 7, 12)),
    pv("2nd Inv", n("F#", 7, 12, 16)),
  ]},
  { key: "G", suffix: "major", label: "G", voicings: [
    pv("Root", n("G", 0, 4, 7)),
    pv("1st Inv", n("G", 4, 7, 12)),
    pv("2nd Inv", n("G", 7, 12, 16)),
  ]},
  { key: "Ab", suffix: "major", label: "Ab", voicings: [
    pv("Root", n("Ab", 0, 4, 7)),
    pv("1st Inv", n("Ab", 4, 7, 12)),
    pv("2nd Inv", n("Ab", 7, 12, 16)),
  ]},
  { key: "A", suffix: "major", label: "A", voicings: [
    pv("Root", n("A", 0, 4, 7)),
    pv("1st Inv", n("A", 4, 7, 12)),
    pv("2nd Inv", n("A", 7, 12, 16)),
  ]},
  { key: "Bb", suffix: "major", label: "Bb", voicings: [
    pv("Root", n("Bb", 0, 4, 7)),
    pv("1st Inv", n("Bb", 4, 7, 12)),
    pv("2nd Inv", n("Bb", 7, 12, 16)),
  ]},
  { key: "B", suffix: "major", label: "B", voicings: [
    pv("Root", n("B", 0, 4, 7)),
    pv("1st Inv", n("B", 4, 7, 12)),
    pv("2nd Inv", n("B", 7, 12, 16)),
  ]},

  // === MINOR ===
  { key: "C", suffix: "minor", label: "Cm", voicings: [
    pv("Root", n("C", 0, 3, 7)),
    pv("1st Inv", n("C", 3, 7, 12)),
    pv("2nd Inv", n("C", 7, 12, 15)),
  ]},
  { key: "C#", suffix: "minor", label: "C#m", voicings: [
    pv("Root", n("C#", 0, 3, 7)),
    pv("1st Inv", n("C#", 3, 7, 12)),
    pv("2nd Inv", n("C#", 7, 12, 15)),
  ]},
  { key: "D", suffix: "minor", label: "Dm", voicings: [
    pv("Root", n("D", 0, 3, 7)),
    pv("1st Inv", n("D", 3, 7, 12)),
    pv("2nd Inv", n("D", 7, 12, 15)),
  ]},
  { key: "Eb", suffix: "minor", label: "Ebm", voicings: [
    pv("Root", n("Eb", 0, 3, 7)),
    pv("1st Inv", n("Eb", 3, 7, 12)),
    pv("2nd Inv", n("Eb", 7, 12, 15)),
  ]},
  { key: "E", suffix: "minor", label: "Em", voicings: [
    pv("Root", n("E", 0, 3, 7)),
    pv("1st Inv", n("E", 3, 7, 12)),
    pv("2nd Inv", n("E", 7, 12, 15)),
  ]},
  { key: "F", suffix: "minor", label: "Fm", voicings: [
    pv("Root", n("F", 0, 3, 7)),
    pv("1st Inv", n("F", 3, 7, 12)),
    pv("2nd Inv", n("F", 7, 12, 15)),
  ]},
  { key: "F#", suffix: "minor", label: "F#m", voicings: [
    pv("Root", n("F#", 0, 3, 7)),
    pv("1st Inv", n("F#", 3, 7, 12)),
    pv("2nd Inv", n("F#", 7, 12, 15)),
  ]},
  { key: "G", suffix: "minor", label: "Gm", voicings: [
    pv("Root", n("G", 0, 3, 7)),
    pv("1st Inv", n("G", 3, 7, 12)),
    pv("2nd Inv", n("G", 7, 12, 15)),
  ]},
  { key: "Ab", suffix: "minor", label: "Abm", voicings: [
    pv("Root", n("Ab", 0, 3, 7)),
    pv("1st Inv", n("Ab", 3, 7, 12)),
    pv("2nd Inv", n("Ab", 7, 12, 15)),
  ]},
  { key: "A", suffix: "minor", label: "Am", voicings: [
    pv("Root", n("A", 0, 3, 7)),
    pv("1st Inv", n("A", 3, 7, 12)),
    pv("2nd Inv", n("A", 7, 12, 15)),
  ]},
  { key: "Bb", suffix: "minor", label: "Bbm", voicings: [
    pv("Root", n("Bb", 0, 3, 7)),
    pv("1st Inv", n("Bb", 3, 7, 12)),
    pv("2nd Inv", n("Bb", 7, 12, 15)),
  ]},
  { key: "B", suffix: "minor", label: "Bm", voicings: [
    pv("Root", n("B", 0, 3, 7)),
    pv("1st Inv", n("B", 3, 7, 12)),
    pv("2nd Inv", n("B", 7, 12, 15)),
  ]},

  // === DOMINANT 7 ===
  { key: "C", suffix: "7", label: "C7", voicings: [
    pv("Root", n("C", 0, 4, 7, 10)),
    pv("1st Inv", n("C", 4, 7, 10, 12)),
  ]},
  { key: "C#", suffix: "7", label: "C#7", voicings: [
    pv("Root", n("C#", 0, 4, 7, 10)),
    pv("1st Inv", n("C#", 4, 7, 10, 12)),
  ]},
  { key: "D", suffix: "7", label: "D7", voicings: [
    pv("Root", n("D", 0, 4, 7, 10)),
    pv("1st Inv", n("D", 4, 7, 10, 12)),
  ]},
  { key: "Eb", suffix: "7", label: "Eb7", voicings: [
    pv("Root", n("Eb", 0, 4, 7, 10)),
    pv("1st Inv", n("Eb", 4, 7, 10, 12)),
  ]},
  { key: "E", suffix: "7", label: "E7", voicings: [
    pv("Root", n("E", 0, 4, 7, 10)),
    pv("1st Inv", n("E", 4, 7, 10, 12)),
  ]},
  { key: "F", suffix: "7", label: "F7", voicings: [
    pv("Root", n("F", 0, 4, 7, 10)),
    pv("1st Inv", n("F", 4, 7, 10, 12)),
  ]},
  { key: "F#", suffix: "7", label: "F#7", voicings: [
    pv("Root", n("F#", 0, 4, 7, 10)),
    pv("1st Inv", n("F#", 4, 7, 10, 12)),
  ]},
  { key: "G", suffix: "7", label: "G7", voicings: [
    pv("Root", n("G", 0, 4, 7, 10)),
    pv("1st Inv", n("G", 4, 7, 10, 12)),
  ]},
  { key: "Ab", suffix: "7", label: "Ab7", voicings: [
    pv("Root", n("Ab", 0, 4, 7, 10)),
    pv("1st Inv", n("Ab", 4, 7, 10, 12)),
  ]},
  { key: "A", suffix: "7", label: "A7", voicings: [
    pv("Root", n("A", 0, 4, 7, 10)),
    pv("1st Inv", n("A", 4, 7, 10, 12)),
  ]},
  { key: "Bb", suffix: "7", label: "Bb7", voicings: [
    pv("Root", n("Bb", 0, 4, 7, 10)),
    pv("1st Inv", n("Bb", 4, 7, 10, 12)),
  ]},
  { key: "B", suffix: "7", label: "B7", voicings: [
    pv("Root", n("B", 0, 4, 7, 10)),
    pv("1st Inv", n("B", 4, 7, 10, 12)),
  ]},

  // === MINOR 7 ===
  { key: "C", suffix: "m7", label: "Cm7", voicings: [
    pv("Root", n("C", 0, 3, 7, 10)),
    pv("1st Inv", n("C", 3, 7, 10, 12)),
  ]},
  { key: "C#", suffix: "m7", label: "C#m7", voicings: [
    pv("Root", n("C#", 0, 3, 7, 10)),
    pv("1st Inv", n("C#", 3, 7, 10, 12)),
  ]},
  { key: "D", suffix: "m7", label: "Dm7", voicings: [
    pv("Root", n("D", 0, 3, 7, 10)),
    pv("1st Inv", n("D", 3, 7, 10, 12)),
  ]},
  { key: "Eb", suffix: "m7", label: "Ebm7", voicings: [
    pv("Root", n("Eb", 0, 3, 7, 10)),
    pv("1st Inv", n("Eb", 3, 7, 10, 12)),
  ]},
  { key: "E", suffix: "m7", label: "Em7", voicings: [
    pv("Root", n("E", 0, 3, 7, 10)),
    pv("1st Inv", n("E", 3, 7, 10, 12)),
  ]},
  { key: "F", suffix: "m7", label: "Fm7", voicings: [
    pv("Root", n("F", 0, 3, 7, 10)),
    pv("1st Inv", n("F", 3, 7, 10, 12)),
  ]},
  { key: "F#", suffix: "m7", label: "F#m7", voicings: [
    pv("Root", n("F#", 0, 3, 7, 10)),
    pv("1st Inv", n("F#", 3, 7, 10, 12)),
  ]},
  { key: "G", suffix: "m7", label: "Gm7", voicings: [
    pv("Root", n("G", 0, 3, 7, 10)),
    pv("1st Inv", n("G", 3, 7, 10, 12)),
  ]},
  { key: "Ab", suffix: "m7", label: "Abm7", voicings: [
    pv("Root", n("Ab", 0, 3, 7, 10)),
    pv("1st Inv", n("Ab", 3, 7, 10, 12)),
  ]},
  { key: "A", suffix: "m7", label: "Am7", voicings: [
    pv("Root", n("A", 0, 3, 7, 10)),
    pv("1st Inv", n("A", 3, 7, 10, 12)),
  ]},
  { key: "Bb", suffix: "m7", label: "Bbm7", voicings: [
    pv("Root", n("Bb", 0, 3, 7, 10)),
    pv("1st Inv", n("Bb", 3, 7, 10, 12)),
  ]},
  { key: "B", suffix: "m7", label: "Bm7", voicings: [
    pv("Root", n("B", 0, 3, 7, 10)),
    pv("1st Inv", n("B", 3, 7, 10, 12)),
  ]},

  // === MAJ7 ===
  { key: "C", suffix: "maj7", label: "Cmaj7", voicings: [
    pv("Root", n("C", 0, 4, 7, 11)),
    pv("1st Inv", n("C", 4, 7, 11, 12)),
  ]},
  { key: "D", suffix: "maj7", label: "Dmaj7", voicings: [
    pv("Root", n("D", 0, 4, 7, 11)),
    pv("1st Inv", n("D", 4, 7, 11, 12)),
  ]},
  { key: "Eb", suffix: "maj7", label: "Ebmaj7", voicings: [
    pv("Root", n("Eb", 0, 4, 7, 11)),
    pv("1st Inv", n("Eb", 4, 7, 11, 12)),
  ]},
  { key: "F", suffix: "maj7", label: "Fmaj7", voicings: [
    pv("Root", n("F", 0, 4, 7, 11)),
    pv("1st Inv", n("F", 4, 7, 11, 12)),
  ]},
  { key: "G", suffix: "maj7", label: "Gmaj7", voicings: [
    pv("Root", n("G", 0, 4, 7, 11)),
    pv("1st Inv", n("G", 4, 7, 11, 12)),
  ]},
  { key: "A", suffix: "maj7", label: "Amaj7", voicings: [
    pv("Root", n("A", 0, 4, 7, 11)),
    pv("1st Inv", n("A", 4, 7, 11, 12)),
  ]},
  { key: "Bb", suffix: "maj7", label: "Bbmaj7", voicings: [
    pv("Root", n("Bb", 0, 4, 7, 11)),
    pv("1st Inv", n("Bb", 4, 7, 11, 12)),
  ]},
  { key: "B", suffix: "maj7", label: "Bmaj7", voicings: [
    pv("Root", n("B", 0, 4, 7, 11)),
    pv("1st Inv", n("B", 4, 7, 11, 12)),
  ]},

  // === DIM ===
  { key: "C", suffix: "dim", label: "Cdim", voicings: [pv("Root", n("C", 0, 3, 6))] },
  { key: "D", suffix: "dim", label: "Ddim", voicings: [pv("Root", n("D", 0, 3, 6))] },
  { key: "E", suffix: "dim", label: "Edim", voicings: [pv("Root", n("E", 0, 3, 6))] },
  { key: "F", suffix: "dim", label: "Fdim", voicings: [pv("Root", n("F", 0, 3, 6))] },
  { key: "G", suffix: "dim", label: "Gdim", voicings: [pv("Root", n("G", 0, 3, 6))] },
  { key: "A", suffix: "dim", label: "Adim", voicings: [pv("Root", n("A", 0, 3, 6))] },
  { key: "B", suffix: "dim", label: "Bdim", voicings: [pv("Root", n("B", 0, 3, 6))] },

  // === AUG ===
  { key: "C", suffix: "aug", label: "Caug", voicings: [pv("Root", n("C", 0, 4, 8))] },
  { key: "D", suffix: "aug", label: "Daug", voicings: [pv("Root", n("D", 0, 4, 8))] },
  { key: "E", suffix: "aug", label: "Eaug", voicings: [pv("Root", n("E", 0, 4, 8))] },
  { key: "F", suffix: "aug", label: "Faug", voicings: [pv("Root", n("F", 0, 4, 8))] },
  { key: "G", suffix: "aug", label: "Gaug", voicings: [pv("Root", n("G", 0, 4, 8))] },
  { key: "A", suffix: "aug", label: "Aaug", voicings: [pv("Root", n("A", 0, 4, 8))] },
  { key: "B", suffix: "aug", label: "Baug", voicings: [pv("Root", n("B", 0, 4, 8))] },

  // === SUS4 ===
  { key: "C", suffix: "sus4", label: "Csus4", voicings: [pv("Root", n("C", 0, 5, 7))] },
  { key: "D", suffix: "sus4", label: "Dsus4", voicings: [pv("Root", n("D", 0, 5, 7))] },
  { key: "E", suffix: "sus4", label: "Esus4", voicings: [pv("Root", n("E", 0, 5, 7))] },
  { key: "F", suffix: "sus4", label: "Fsus4", voicings: [pv("Root", n("F", 0, 5, 7))] },
  { key: "G", suffix: "sus4", label: "Gsus4", voicings: [pv("Root", n("G", 0, 5, 7))] },
  { key: "A", suffix: "sus4", label: "Asus4", voicings: [pv("Root", n("A", 0, 5, 7))] },
  { key: "B", suffix: "sus4", label: "Bsus4", voicings: [pv("Root", n("B", 0, 5, 7))] },

  // === SUS2 ===
  { key: "C", suffix: "sus2", label: "Csus2", voicings: [pv("Root", n("C", 0, 2, 7))] },
  { key: "D", suffix: "sus2", label: "Dsus2", voicings: [pv("Root", n("D", 0, 2, 7))] },
  { key: "E", suffix: "sus2", label: "Esus2", voicings: [pv("Root", n("E", 0, 2, 7))] },
  { key: "F", suffix: "sus2", label: "Fsus2", voicings: [pv("Root", n("F", 0, 2, 7))] },
  { key: "G", suffix: "sus2", label: "Gsus2", voicings: [pv("Root", n("G", 0, 2, 7))] },
  { key: "A", suffix: "sus2", label: "Asus2", voicings: [pv("Root", n("A", 0, 2, 7))] },
  { key: "B", suffix: "sus2", label: "Bsus2", voicings: [pv("Root", n("B", 0, 2, 7))] },
];

export const pianoRootNotes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
export const pianoSuffixes = ["major", "minor", "7", "m7", "maj7", "dim", "aug", "sus4", "sus2"];
export const pianoSuffixLabels: Record<string, string> = {
  major: "Major", minor: "Minor", "7": "7", m7: "m7", maj7: "maj7",
  dim: "dim", aug: "aug", sus4: "sus4", sus2: "sus2",
};

export function getAllPianoChords(): PianoChord[] {
  return pianoChordData;
}

export function searchPianoChords(query: string): PianoChord[] {
  const q = query.toLowerCase().trim();
  return pianoChordData.filter(c =>
    c.label.toLowerCase().includes(q) ||
    c.key.toLowerCase().includes(q) ||
    `${c.key}${c.suffix}`.toLowerCase().includes(q)
  );
}
