export interface ProgressionChord {
  semitones: number; // from root
  suffix: string;    // chord quality
}

export interface Progression {
  id: string;
  name: string;
  category: "Pop" | "Rock" | "Jazz" | "Blues" | "Classical" | "Minor";
  chords: ProgressionChord[];
  description: string;
}

export const PROGRESSIONS: Progression[] = [
  // ── Pop ──
  { id: "pop-1", name: "I – V – vi – IV", category: "Pop",
    chords: [{semitones:0,suffix:"major"},{semitones:7,suffix:"major"},{semitones:9,suffix:"minor"},{semitones:5,suffix:"major"}],
    description: "The most common pop progression — thousands of songs" },
  { id: "pop-2", name: "I – vi – IV – V", category: "Pop",
    chords: [{semitones:0,suffix:"major"},{semitones:9,suffix:"minor"},{semitones:5,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "The '50s doo-wop progression" },
  { id: "pop-3", name: "vi – IV – I – V", category: "Pop",
    chords: [{semitones:9,suffix:"minor"},{semitones:5,suffix:"major"},{semitones:0,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "Minor-starting version of I-V-vi-IV" },
  { id: "pop-4", name: "I – V – vi – iii – IV", category: "Pop",
    chords: [{semitones:0,suffix:"major"},{semitones:7,suffix:"major"},{semitones:9,suffix:"minor"},{semitones:4,suffix:"minor"},{semitones:5,suffix:"major"}],
    description: "Pachelbel Canon — lush descending feel" },
  { id: "pop-5", name: "I – iii – IV – V", category: "Pop",
    chords: [{semitones:0,suffix:"major"},{semitones:4,suffix:"minor"},{semitones:5,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "Bright ascending feel, great for verses" },

  // ── Rock ──
  { id: "rock-1", name: "I – IV – V", category: "Rock",
    chords: [{semitones:0,suffix:"major"},{semitones:5,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "Classic 3-chord rock & country staple" },
  { id: "rock-2", name: "I – bVII – IV", category: "Rock",
    chords: [{semitones:0,suffix:"major"},{semitones:10,suffix:"major"},{semitones:5,suffix:"major"}],
    description: "Rock anthem feel — think Lynyrd Skynyrd" },
  { id: "rock-3", name: "I – IV – I – V", category: "Rock",
    chords: [{semitones:0,suffix:"major"},{semitones:5,suffix:"major"},{semitones:0,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "Simple shuffle rock loop" },
  { id: "rock-4", name: "I – bVII – bVI – V", category: "Rock",
    chords: [{semitones:0,suffix:"major"},{semitones:10,suffix:"major"},{semitones:8,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "Andalusian cadence — dramatic descending" },
  { id: "rock-5", name: "I – IV – bVII – IV", category: "Rock",
    chords: [{semitones:0,suffix:"major"},{semitones:5,suffix:"major"},{semitones:10,suffix:"major"},{semitones:5,suffix:"major"}],
    description: "Classic rock loop with borrowed bVII" },

  // ── Blues ──
  { id: "blues-1", name: "12-Bar Blues (I – IV – V)", category: "Blues",
    chords: [{semitones:0,suffix:"7"},{semitones:5,suffix:"7"},{semitones:0,suffix:"7"},{semitones:0,suffix:"7"},{semitones:5,suffix:"7"},{semitones:5,suffix:"7"},{semitones:0,suffix:"7"},{semitones:0,suffix:"7"},{semitones:7,suffix:"7"},{semitones:5,suffix:"7"},{semitones:0,suffix:"7"},{semitones:7,suffix:"7"}],
    description: "The 12-bar blues — I7 I7 I7 I7 / IV7 IV7 I7 I7 / V7 IV7 I7 V7" },
  { id: "blues-2", name: "Quick-Change Blues", category: "Blues",
    chords: [{semitones:0,suffix:"7"},{semitones:5,suffix:"7"},{semitones:0,suffix:"7"},{semitones:0,suffix:"7"},{semitones:5,suffix:"7"},{semitones:5,suffix:"7"},{semitones:0,suffix:"7"},{semitones:0,suffix:"7"},{semitones:7,suffix:"7"},{semitones:5,suffix:"7"},{semitones:0,suffix:"7"},{semitones:7,suffix:"7"}],
    description: "Bar 2 switches early to IV — common in Chicago blues" },
  { id: "blues-3", name: "Minor Blues", category: "Blues",
    chords: [{semitones:0,suffix:"m7"},{semitones:5,suffix:"m7"},{semitones:0,suffix:"m7"},{semitones:0,suffix:"m7"},{semitones:5,suffix:"m7"},{semitones:5,suffix:"m7"},{semitones:0,suffix:"m7"},{semitones:0,suffix:"m7"},{semitones:7,suffix:"7"},{semitones:5,suffix:"m7"},{semitones:0,suffix:"m7"},{semitones:7,suffix:"7"}],
    description: "Dark minor version of the 12-bar" },

  // ── Jazz ──
  { id: "jazz-1", name: "ii – V – I", category: "Jazz",
    chords: [{semitones:2,suffix:"m7"},{semitones:7,suffix:"7"},{semitones:0,suffix:"maj7"}],
    description: "The fundamental jazz cadence" },
  { id: "jazz-2", name: "ii – V – I – VI", category: "Jazz",
    chords: [{semitones:2,suffix:"m7"},{semitones:7,suffix:"7"},{semitones:0,suffix:"maj7"},{semitones:9,suffix:"7"}],
    description: "Turnaround — VI7 sets up return to ii" },
  { id: "jazz-3", name: "I – VI – ii – V", category: "Jazz",
    chords: [{semitones:0,suffix:"maj7"},{semitones:9,suffix:"7"},{semitones:2,suffix:"m7"},{semitones:7,suffix:"7"}],
    description: "The jazz rhythm changes intro" },
  { id: "jazz-4", name: "iii – VI – ii – V", category: "Jazz",
    chords: [{semitones:4,suffix:"m7"},{semitones:9,suffix:"7"},{semitones:2,suffix:"m7"},{semitones:7,suffix:"7"}],
    description: "Circle of fifths turnaround" },
  { id: "jazz-5", name: "I – IV – iii – VI", category: "Jazz",
    chords: [{semitones:0,suffix:"maj7"},{semitones:5,suffix:"maj7"},{semitones:4,suffix:"m7"},{semitones:9,suffix:"7"}],
    description: "Smooth jazz movement" },

  // ── Minor ──
  { id: "minor-1", name: "i – bVII – bVI – V", category: "Minor",
    chords: [{semitones:0,suffix:"minor"},{semitones:10,suffix:"major"},{semitones:8,suffix:"major"},{semitones:7,suffix:"major"}],
    description: "Andalusian cadence — moody & powerful" },
  { id: "minor-2", name: "i – iv – v – i", category: "Minor",
    chords: [{semitones:0,suffix:"minor"},{semitones:5,suffix:"minor"},{semitones:7,suffix:"minor"},{semitones:0,suffix:"minor"}],
    description: "Natural minor loop" },
  { id: "minor-3", name: "i – bVI – bIII – bVII", category: "Minor",
    chords: [{semitones:0,suffix:"minor"},{semitones:8,suffix:"major"},{semitones:3,suffix:"major"},{semitones:10,suffix:"major"}],
    description: "Epic minor progression — film & metal favourite" },
  { id: "minor-4", name: "i – iv – bVII – bIII", category: "Minor",
    chords: [{semitones:0,suffix:"minor"},{semitones:5,suffix:"minor"},{semitones:10,suffix:"major"},{semitones:3,suffix:"major"}],
    description: "Dark descending minor feel" },
  { id: "minor-5", name: "i – V – bVI – bVII", category: "Minor",
    chords: [{semitones:0,suffix:"minor"},{semitones:7,suffix:"major"},{semitones:8,suffix:"major"},{semitones:10,suffix:"major"}],
    description: "Harmonic minor with dramatic V major" },

  // ── Classical ──
  { id: "classical-1", name: "I – IV – V – I", category: "Classical",
    chords: [{semitones:0,suffix:"major"},{semitones:5,suffix:"major"},{semitones:7,suffix:"major"},{semitones:0,suffix:"major"}],
    description: "Perfect authentic cadence" },
  { id: "classical-2", name: "I – ii – V – I", category: "Classical",
    chords: [{semitones:0,suffix:"major"},{semitones:2,suffix:"minor"},{semitones:7,suffix:"major"},{semitones:0,suffix:"major"}],
    description: "ii substitutes for IV — smoother motion" },
  { id: "classical-3", name: "I – V – IV – I", category: "Classical",
    chords: [{semitones:0,suffix:"major"},{semitones:7,suffix:"major"},{semitones:5,suffix:"major"},{semitones:0,suffix:"major"}],
    description: "Plagal cadence — the 'Amen' ending" },
];

export const CATEGORIES = ["Pop","Rock","Blues","Jazz","Minor","Classical"] as const;

const PITCH_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const PITCH_OF: Record<string,number> = {
  C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11
};

/** Resolve a progression to concrete chord labels given a root key */
export function resolveProgression(
  prog: Progression,
  rootKey: string,
): Array<{ key: string; suffix: string; label: string }> {
  const rootPitch = PITCH_OF[rootKey] ?? 0;
  return prog.chords.map(({ semitones, suffix }) => {
    const p = (rootPitch + semitones) % 12;
    const key = PITCH_NAMES[p];
    const label = key + (suffix === "major" ? "" : suffix === "minor" ? "m" : suffix);
    return { key, suffix, label };
  });
}
