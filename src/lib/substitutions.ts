const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PITCH_OF: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8,
  Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

function noteAt(root: string, semitones: number): string {
  const p = ((PITCH_OF[root] ?? 0) + semitones + 120) % 12;
  return PITCH_NAMES[p];
}

export interface SubSuggestion {
  key: string;
  suffix: string;
  label: string;
  reason: string;
}

/**
 * Returns up to 6 chord substitution suggestions for a given chord.
 * existingKeys: set of "key-suffix" strings present in the library, used to filter out missing chords.
 */
export function getSubstitutions(
  key: string,
  suffix: string,
  existingKeys: Set<string>,
): SubSuggestion[] {
  const results: SubSuggestion[] = [];

  const has = (k: string, s: string) => existingKeys.has(`${k}-${s}`);
  const add = (k: string, s: string, reason: string) => {
    if (k === key && s === suffix) return;
    if (!has(k, s)) return;
    const label = k + (s === "major" ? "" : s);
    results.push({ key: k, suffix: s, label, reason });
  };

  // ── Parallel mode (same root, different quality) ──
  if (suffix === "major") {
    add(key, "minor",  "Parallel minor");
    add(key, "maj7",   "Add major 7th");
    add(key, "7",      "Dominant version");
    add(key, "add9",   "Add colour with 9th");
    add(key, "sus4",   "Suspend for tension");
    add(key, "6",      "Softer with major 6th");
  }
  if (suffix === "minor") {
    add(key, "major",  "Parallel major — brighter");
    add(key, "m7",     "Add minor 7th");
    add(key, "m9",     "Richer with 9th");
    add(key, "sus2",   "Open sus2");
  }
  if (suffix === "7") {
    add(key, "major",  "Remove tension (drop b7)");
    add(key, "9",      "Extend to dominant 9th");
    add(key, "7#9",    "Hendrix colour");
    add(key, "7b9",    "Dark altered tension");
    // Tritone sub: ±6 semitones, also dominant 7th
    const tt = noteAt(key, 6);
    add(tt, "7", `Tritone sub (${tt}7)`);
  }
  if (suffix === "maj7") {
    add(key, "major",  "Simpler (drop 7th)");
    add(key, "maj9",   "Extend to maj9");
    add(key, "6",      "Maj6 — similar colour");
    add(key, "add9",   "Lighter add9 version");
  }
  if (suffix === "m7") {
    add(key, "minor",  "Simpler (drop 7th)");
    add(key, "m9",     "Extend to m9");
    add(key, "m7b5",   "Half-dim — darker");
  }
  if (suffix === "m7b5") {
    add(key, "dim7",   "Full diminished");
    add(noteAt(key, 3), "7",  "Related dominant 7th");
  }
  if (suffix === "dim" || suffix === "dim7") {
    // Diminished resolves up a semitone
    add(noteAt(key, 1), "major", "Resolve up a semitone");
    add(noteAt(key, 1), "minor", "Resolve up (minor)");
    add(key, suffix === "dim" ? "dim7" : "dim", "Toggle dim/dim7");
  }
  if (suffix === "sus4") {
    add(key, "major",  "Resolve sus4 → major");
    add(key, "sus2",   "Sus2 alternative");
    add(key, "7",      "Dominant resolution");
  }
  if (suffix === "sus2") {
    add(key, "major",  "Resolve to major");
    add(key, "sus4",   "Sus4 alternative");
    add(key, "add9",   "Add9 — similar open feel");
  }
  if (suffix === "add9") {
    add(key, "major",  "Simpler without 9th");
    add(key, "maj9",   "Full maj9");
    add(key, "sus2",   "Sus2 — similar voicing");
  }

  // ── Relative major / minor ──
  if (suffix === "major") {
    const rel = noteAt(key, 9); // relative minor is 9 semitones up (=3 down)
    add(rel, "minor",  `Relative minor (${rel}m)`);
    add(rel, "m7",     `Relative m7 (${rel}m7)`);
  }
  if (suffix === "minor") {
    const rel = noteAt(key, 3); // relative major is b3 up
    add(rel, "major",  `Relative major (${rel})`);
    add(rel, "maj7",   `Relative maj7 (${rel}maj7)`);
  }

  // ── Upper-structure / extensions ──
  if (suffix === "9") {
    add(key, "7",   "Simpler dominant 7th");
    add(key, "13",  "Extend to 13th");
  }
  if (suffix === "13") {
    add(key, "9",   "Simpler 9th");
    add(key, "7",   "Core dominant 7th");
  }

  // Deduplicate by key-suffix
  const seen = new Set<string>();
  return results.filter(s => {
    const k = `${s.key}-${s.suffix}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 6);
}
