import type { Chord, ChordVoicing } from "@/data/chords";
import { getAllChordsWithCustom } from "@/data/chords";

// ── Types ──

export interface ProgressionChord {
  key: string;
  suffix: string;
  label: string;
}

export interface ScoredVoicing {
  voicing: ChordVoicing;
  voicingIndex: number;
  avgFret: number;
  score: number; // lower = better
}

export interface VoicingPath {
  label: string;         // "Low Position", "Mid Position", "High Position"
  region: "low" | "mid" | "high";
  voicings: ScoredVoicing[];
  totalScore: number;
}

// ── Helpers ──

/** Average fret of played (non-muted, non-open) positions */
export function getAvgFret(voicing: ChordVoicing): number {
  const played = voicing.positions.filter(p => p > 0);
  if (played.length === 0) return 0;
  return played.reduce((a, b) => a + b, 0) / played.length;
}

/** Fret distance score between two voicings (sum of absolute fret diffs for played strings) */
export function fretDistance(a: ChordVoicing, b: ChordVoicing): number {
  let dist = 0;
  let compared = 0;
  for (let i = 0; i < 6; i++) {
    const fa = a.positions[i];
    const fb = b.positions[i];
    if (fa > 0 && fb > 0) {
      dist += Math.abs(fa - fb);
      compared++;
    }
  }
  // Penalize if few strings overlap
  if (compared === 0) return 12;
  return dist / compared;
}

// ── Region Classification ──

type Region = "low" | "mid" | "high";

function classifyRegion(avgFret: number): Region {
  if (avgFret <= 4) return "low";
  if (avgFret <= 8) return "mid";
  return "high";
}

function groupVoicingsByRegion(chord: Chord): Record<Region, { voicing: ChordVoicing; index: number; avgFret: number }[]> {
  const groups: Record<Region, { voicing: ChordVoicing; index: number; avgFret: number }[]> = {
    low: [], mid: [], high: [],
  };
  chord.voicings.forEach((v, idx) => {
    const avg = getAvgFret(v);
    const region = classifyRegion(avg);
    groups[region].push({ voicing: v, index: idx, avgFret: avg });
  });
  return groups;
}

// ── Path Optimizer ──

/**
 * For a given region, find the best voicing path through the progression
 * minimizing total fret distance between consecutive chords.
 * Uses greedy approach (MVP — fast and good enough).
 */
function findBestPathForRegion(
  chords: Chord[],
  region: Region
): ScoredVoicing[] | null {
  const groupedPerChord = chords.map(c => groupVoicingsByRegion(c));

  // For each chord, get candidates in this region (fallback to closest region)
  const candidates = groupedPerChord.map((groups, i) => {
    let pool = groups[region];
    if (pool.length === 0) {
      // Fallback: pick from adjacent regions
      if (region === "low") pool = groups["mid"];
      else if (region === "high") pool = groups["mid"];
      else pool = [...groups["low"], ...groups["high"]];
    }
    if (pool.length === 0) {
      // Last resort: all voicings
      pool = chords[i].voicings.map((v, idx) => ({
        voicing: v, index: idx, avgFret: getAvgFret(v),
      }));
    }
    return pool;
  });

  if (candidates.some(c => c.length === 0)) return null;

  // Greedy: pick first chord's voicing closest to region center, then minimize distance
  const regionCenter = region === "low" ? 2 : region === "mid" ? 6 : 10;
  const result: ScoredVoicing[] = [];

  // Pick first voicing closest to region center
  const firstCandidates = [...candidates[0]].sort(
    (a, b) => Math.abs(a.avgFret - regionCenter) - Math.abs(b.avgFret - regionCenter)
  );
  const first = firstCandidates[0];
  result.push({
    voicing: first.voicing,
    voicingIndex: first.index,
    avgFret: first.avgFret,
    score: 0,
  });

  // Greedily pick next voicings
  for (let i = 1; i < candidates.length; i++) {
    const prev = result[i - 1].voicing;
    let bestCandidate = candidates[i][0];
    let bestDist = fretDistance(prev, bestCandidate.voicing);

    for (let j = 1; j < candidates[i].length; j++) {
      const dist = fretDistance(prev, candidates[i][j].voicing);
      if (dist < bestDist) {
        bestDist = dist;
        bestCandidate = candidates[i][j];
      }
    }

    result.push({
      voicing: bestCandidate.voicing,
      voicingIndex: bestCandidate.index,
      avgFret: bestCandidate.avgFret,
      score: bestDist,
    });
  }

  return result;
}

// ── Public API ──

export function resolveChords(progression: ProgressionChord[]): Chord[] {
  const allChords = getAllChordsWithCustom();
  return progression.map(p => {
    const found = allChords.find(c => c.key === p.key && c.suffix === p.suffix);
    return found ?? { key: p.key, suffix: p.suffix, label: p.label, voicings: [] };
  });
}

export function generateVoicingPaths(progression: ProgressionChord[]): VoicingPath[] {
  const chords = resolveChords(progression);
  if (chords.length === 0 || chords.some(c => c.voicings.length === 0)) return [];

  const regions: { region: Region; label: string }[] = [
    { region: "low", label: "Low Position (Frets 0–4)" },
    { region: "mid", label: "Mid Position (Frets 5–8)" },
    { region: "high", label: "High Position (Frets 9+)" },
  ];

  const paths: VoicingPath[] = [];
  for (const { region, label } of regions) {
    const voicings = findBestPathForRegion(chords, region);
    if (voicings) {
      const totalScore = voicings.reduce((sum, v) => sum + v.score, 0);
      paths.push({ label, region, voicings, totalScore });
    }
  }

  return paths;
}

// ── Chord search/autocomplete helpers ──

const ROOTS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

const ALL_SUFFIXES: { suffix: string; label: string }[] = [
  { suffix: "major", label: "" },
  { suffix: "minor", label: "m" },
  { suffix: "7", label: "7" },
  { suffix: "m7", label: "m7" },
  { suffix: "maj7", label: "maj7" },
  { suffix: "dim", label: "dim" },
  { suffix: "dim7", label: "dim7" },
  { suffix: "aug", label: "aug" },
  { suffix: "sus4", label: "sus4" },
  { suffix: "sus2", label: "sus2" },
  { suffix: "6", label: "6" },
  { suffix: "m6", label: "m6" },
  { suffix: "9", label: "9" },
  { suffix: "m9", label: "m9" },
  { suffix: "maj9", label: "maj9" },
  { suffix: "add9", label: "add9" },
  { suffix: "11", label: "11" },
  { suffix: "m11", label: "m11" },
  { suffix: "13", label: "13" },
  { suffix: "m13", label: "m13" },
  { suffix: "7sus4", label: "7sus4" },
  { suffix: "7sus2", label: "7sus2" },
  { suffix: "m7b5", label: "m7b5" },
  { suffix: "minmaj7", label: "m(maj7)" },
  { suffix: "7b9", label: "7b9" },
  { suffix: "7#9", label: "7#9" },
  { suffix: "7b5", label: "7b5" },
  { suffix: "7#5", label: "7#5" },
  { suffix: "7#11", label: "7#11" },
  { suffix: "7alt", label: "7alt" },
  { suffix: "add11", label: "add11" },
  { suffix: "m(add9)", label: "m(add9)" },
  { suffix: "maj13", label: "maj13" },
  { suffix: "69", label: "69" },
];

const BASS_NOTES = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"];

/** Build searchable chord list including slash chords */
function buildSearchableChords(): { key: string; suffix: string; label: string }[] {
  const results: { key: string; suffix: string; label: string }[] = [];
  
  // Existing chords from database
  const allChords = getAllChordsWithCustom();
  for (const c of allChords) {
    results.push({ key: c.key, suffix: c.suffix, label: c.label });
  }
  const existingLabels = new Set(results.map(r => r.label));

  // Generate all root+suffix combos not already in DB
  for (const root of ROOTS) {
    for (const { suffix, label: suffLabel } of ALL_SUFFIXES) {
      const label = `${root}${suffLabel}`;
      if (!existingLabels.has(label)) {
        results.push({ key: root, suffix, label });
        existingLabels.add(label);
      }
    }
  }
  
  // Slash chords: only generate when searched (too many otherwise)
  return results;
}

let _cachedSearchable: { key: string; suffix: string; label: string }[] | null = null;

function getSearchableChords() {
  if (!_cachedSearchable) _cachedSearchable = buildSearchableChords();
  return _cachedSearchable;
}

export function getAvailableChordLabels(): { key: string; suffix: string; label: string }[] {
  return getSearchableChords();
}

export function searchChords(query: string): { key: string; suffix: string; label: string }[] {
  const all = getSearchableChords();
  if (!query.trim()) return all.slice(0, 24);
  const q = query.toLowerCase().trim();
  
  // Check if query contains a slash (searching for slash chords)
  const slashMatch = q.match(/^([a-g][#b]?\w*)\s*\/\s*([a-g]?[#b]?)$/i);
  if (slashMatch) {
    const chordPart = slashMatch[1].toLowerCase();
    const bassPart = slashMatch[2].toLowerCase();
    
    // Find matching base chords
    const baseMatches = all.filter(c => c.label.toLowerCase().startsWith(chordPart) || c.label.toLowerCase() === chordPart);
    const slashResults: { key: string; suffix: string; label: string }[] = [];
    
    for (const base of baseMatches.slice(0, 6)) {
      for (const bass of BASS_NOTES) {
        if (bassPart && !bass.toLowerCase().startsWith(bassPart)) continue;
        const label = `${base.label}/${bass}`;
        slashResults.push({ key: base.key, suffix: `${base.suffix}/${bass}`, label });
      }
    }
    return slashResults.slice(0, 24);
  }
  
  // Regular search with smart sorting
  const exact: typeof all = [];
  const startsWith: typeof all = [];
  const includes: typeof all = [];
  
  for (const c of all) {
    const lbl = c.label.toLowerCase();
    if (lbl === q) exact.push(c);
    else if (lbl.startsWith(q)) startsWith.push(c);
    else if (lbl.includes(q)) includes.push(c);
  }
  
  return [...exact, ...startsWith, ...includes].slice(0, 24);
}
