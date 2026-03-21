import type { LeadSheet } from "./leadsheet";

export interface SongChord {
  label: string;       // e.g. "Cm", "Abmaj7", "G7"
  chordKey: string;    // e.g. "C", "Ab", "G"
  suffix: string;      // e.g. "minor", "maj7", "7"
  voicingIndex: number; // which voicing to display
}

export type MeterType = "4/4" | "3/4" | "6/8" | "2/4" | "5/4" | "7/8" | "custom";

export interface Meter {
  type: MeterType;
  beatsPerMeasure: number;  // numerator
  beatUnit: number;         // denominator
}

export const PRESET_METERS: Record<Exclude<MeterType, "custom">, Meter> = {
  "4/4": { type: "4/4", beatsPerMeasure: 4, beatUnit: 4 },
  "3/4": { type: "3/4", beatsPerMeasure: 3, beatUnit: 4 },
  "6/8": { type: "6/8", beatsPerMeasure: 6, beatUnit: 8 },
  "2/4": { type: "2/4", beatsPerMeasure: 2, beatUnit: 4 },
  "5/4": { type: "5/4", beatsPerMeasure: 5, beatUnit: 4 },
  "7/8": { type: "7/8", beatsPerMeasure: 7, beatUnit: 8 },
};

export interface SongSection {
  id: string;
  type: "verse" | "chorus" | "bridge" | "intro" | "outro" | "pre-chorus" | "solo" | "interlude";
  label: string;       // e.g. "Verse 1", "Chorus"
  chords: SongChord[];
  meterOverride?: Meter; // if different from song default
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  meter?: Meter;
  sections: SongSection[];
  leadSheet?: LeadSheet;
  createdAt: number;
  updatedAt: number;
}

export const SECTION_TYPES = [
  { value: "intro", label: "Intro" },
  { value: "verse", label: "Verse" },
  { value: "pre-chorus", label: "Pre-Chorus" },
  { value: "chorus", label: "Chorus" },
  { value: "bridge", label: "Bridge" },
  { value: "solo", label: "Solo" },
  { value: "interlude", label: "Interlude" },
  { value: "outro", label: "Outro" },
] as const;

const SONGS_KEY = "chord-library-songs";

export function getSongs(): Song[] {
  try {
    const data = localStorage.getItem(SONGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSongs(songs: Song[]) {
  localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}

export function saveSong(song: Song): Song {
  const songs = getSongs();
  const idx = songs.findIndex(s => s.id === song.id);
  song.updatedAt = Date.now();
  if (idx >= 0) {
    songs[idx] = song;
  } else {
    song.createdAt = Date.now();
    songs.push(song);
  }
  saveSongs(songs);
  return song;
}

export function deleteSong(id: string) {
  const songs = getSongs().filter(s => s.id !== id);
  saveSongs(songs);
}

export function createId(): string {
  return Math.random().toString(36).slice(2, 10);
}
