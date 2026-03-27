const NOTE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

const NATURAL_PITCH_CLASSES: Record<(typeof NOTE_LETTERS)[number], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const ACCIDENTAL_OFFSETS: Record<string, number> = {
  bb: -2,
  b: -1,
  "": 0,
  "#": 1,
  "##": 2,
};

const BASE_INTERVAL_SEMITONES: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
};

export const PIANO_CHORD_FORMULAS: Record<string, string[]> = {
  major: ["1", "3", "5"],
  minor: ["1", "b3", "5"],
  "7": ["1", "3", "5", "b7"],
  m7: ["1", "b3", "5", "b7"],
  maj7: ["1", "3", "5", "7"],
  dim: ["1", "b3", "b5"],
  aug: ["1", "3", "#5"],
  sus4: ["1", "4", "5"],
  sus2: ["1", "2", "5"],
};

function mod12(value: number) {
  return ((value % 12) + 12) % 12;
}

function parseRoot(root: string) {
  const match = root.match(/^([A-G])(bb|b|##|#)?$/);
  if (!match) {
    throw new Error(`Invalid root note: ${root}`);
  }

  const letter = match[1] as (typeof NOTE_LETTERS)[number];
  const accidental = match[2] ?? "";

  return {
    letter,
    pitchClass: mod12(NATURAL_PITCH_CLASSES[letter] + ACCIDENTAL_OFFSETS[accidental]),
  };
}

function parseInterval(interval: string) {
  const match = interval.match(/^([b#]*)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid interval: ${interval}`);
  }

  const accidentalText = match[1] ?? "";
  const degree = Number(match[2]);
  const simpleDegree = ((degree - 1) % 7) + 1;
  const octaveShift = Math.floor((degree - 1) / 7) * 12;
  const accidentalOffset = [...accidentalText].reduce((sum, char) => sum + (char === "b" ? -1 : 1), 0);

  return {
    degree,
    simpleDegree,
    semitones: BASE_INTERVAL_SEMITONES[simpleDegree] + octaveShift + accidentalOffset,
  };
}

function accidentalFromDelta(delta: number) {
  if (delta === -2) return "bb";
  if (delta === -1) return "b";
  if (delta === 0) return "";
  if (delta === 1) return "#";
  if (delta === 2) return "##";
  throw new Error(`Unsupported accidental delta: ${delta}`);
}

export function spellChordTones(root: string, intervals: string[]): string[] {
  const parsedRoot = parseRoot(root);
  const rootLetterIndex = NOTE_LETTERS.indexOf(parsedRoot.letter);

  return intervals.map((interval) => {
    const parsedInterval = parseInterval(interval);
    const targetLetter = NOTE_LETTERS[(rootLetterIndex + parsedInterval.degree - 1) % NOTE_LETTERS.length];
    const targetPitchClass = mod12(parsedRoot.pitchClass + parsedInterval.semitones);
    const naturalPitchClass = NATURAL_PITCH_CLASSES[targetLetter];
    const delta = ((targetPitchClass - naturalPitchClass + 18) % 12) - 6;

    return `${targetLetter}${accidentalFromDelta(delta)}`;
  });
}

export function getChordToneNames(root: string, suffix: string): string[] {
  const formula = PIANO_CHORD_FORMULAS[suffix];
  if (!formula) {
    throw new Error(`Unsupported piano chord suffix: ${suffix}`);
  }

  return spellChordTones(root, formula);
}

export function getVoicingNoteNames(root: string, suffix: string, midiNotes: number[]): string[] {
  const chordToneNames = getChordToneNames(root, suffix);
  const pitchClassToName = new Map<number, string>();

  chordToneNames.forEach((noteName) => {
    const { pitchClass } = parseRoot(noteName);
    if (!pitchClassToName.has(pitchClass)) {
      pitchClassToName.set(pitchClass, noteName);
    }
  });

  return midiNotes.map((midi) => {
    const noteName = pitchClassToName.get(mod12(midi));
    if (!noteName) {
      throw new Error(`Unable to spell MIDI note ${midi} for ${root}${suffix}`);
    }
    const octave = Math.floor(midi / 12) - 1;
    return `${noteName}${octave}`;
  });
}