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

export function getAvailableChordLabels(): { key: string; suffix: string; label: string }[] {
  const allChords = getAllChordsWithCustom();
  return allChords.map(c => ({ key: c.key, suffix: c.suffix, label: c.label }));
}

export function searchChords(query: string): { key: string; suffix: string; label: string }[] {
  const all = getAvailableChordLabels();
  if (!query.trim()) return all.slice(0, 20);
  const q = query.toLowerCase();
  return all.filter(c => c.label.toLowerCase().includes(q)).slice(0, 20);
}
