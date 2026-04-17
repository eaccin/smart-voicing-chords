import { useState, useCallback, useRef, useMemo } from "react";
import { Play, Square } from "lucide-react";
import ScaleFretboard from "@/components/ScaleFretboard";
import { SCALE_INTERVALS, SCALE_LABELS, SCALE_DEGREE_LABELS } from "@/lib/scales";
import { withSharedAudioContext } from "@/hooks/useAudioContext";
import { getAudioSettings } from "@/hooks/useAudioSettings";

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYS = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const SCALE_TYPES = Object.keys(SCALE_LABELS);

const ROOT_PITCH: Record<string, number> = {
  C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,
};
const NOTE_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NOTE_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const USE_FLATS  = new Set(["F","Bb","Eb","Ab","Db","Gb"]);

// ─── Proper enharmonic spelling ───────────────────────────────────────────────
// For 7-note scales each degree gets its own letter (C D E F G A B in order).
// We assign letters sequentially from the root letter, then calculate the
// accidental from the difference between the natural pitch of that letter and
// the actual pitch class.  This produces e.g. D harmonic minor → D E F G A Bb C#
// instead of the wrong D E F G A A# C#.

const LETTERS     = ["C","D","E","F","G","A","B"];
const LETTER_PC: Record<string, number> = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
// Index of the letter name for each root key
const ROOT_LETTER_IDX: Record<string, number> = {
  C:0,"C#":0,Db:1,D:1,"D#":1,Eb:2,E:2,
  F:3,"F#":3,Gb:4,G:4,"G#":4,Ab:5,A:5,
  "A#":5,Bb:6,B:6,
};

function spellNote(pc: number, letter: string): string {
  let diff = pc - LETTER_PC[letter];
  if (diff >  6) diff -= 12;
  if (diff < -6) diff += 12;
  if (diff ===  0) return letter;
  if (diff ===  1) return letter + "#";
  if (diff === -1) return letter + "b";
  if (diff ===  2) return letter + "##";
  if (diff === -2) return letter + "bb";
  return letter;
}

// MIDI root at octave 4
const ROOT_MIDI: Record<string, number> = {
  C:60,"C#":61,D:62,Eb:63,E:64,F:65,"F#":66,G:67,Ab:68,A:69,Bb:70,B:71,
};

const SCALE_DESCRIPTIONS: Record<string, string> = {
  major:            "Bright and happy. The foundation of Western music.",
  minor:            "Dark and emotional. Natural minor, relative to major.",
  "harmonic minor": "Natural minor with a raised 7th. Creates a strong V–i pull. Used in classical, flamenco and metal.",
  "melodic minor":  "Minor with raised 6th and 7th. Jazz's most versatile scale — every mode is used in modern harmony.",
  dorian:           "Minor with a raised 6th — jazzy, soulful. Used heavily in funk and modal jazz.",
  mixolydian:       "Major with a ♭7 — dominant, bluesy. The sound of rock and Celtic music.",
  phrygian:         "Minor with a ♭2 — exotic, tense. Spanish flamenco and heavy metal.",
  "pent. major":    "5-note major scale. Used in folk, country and pop melodies.",
  "pent. minor":    "5-note minor scale. The most-used scale in rock and blues guitar.",
  blues:            "Pentatonic minor + ♭5 blue note. The defining sound of blues and rock.",
  "whole tone":     "6 equal whole steps — symmetrical, floating, dreamlike. Debussy and jazz impressionism.",
  diminished:       "8-note scale alternating W–H steps. Symmetrical, tense. Used over dim7 and dominant chords.",
};

// Diatonic chord qualities per scale type (triads)
// "aug" = augmented triad
const DIATONIC_QUALITIES: Record<string, string[]> = {
  major:            ["major","minor","minor","major","major","minor","dim"],
  minor:            ["minor","dim",  "major","minor","minor","major","major"],
  "harmonic minor": ["minor","dim",  "aug",  "minor","major","major","dim"],
  "melodic minor":  ["minor","minor","aug",  "major","major","dim",  "dim"],
  dorian:           ["minor","minor","major","major","minor","dim",  "major"],
  mixolydian:       ["major","minor","dim",  "major","minor","minor","major"],
  phrygian:         ["minor","major","major","minor","dim",  "major","minor"],
};

const ROMAN = ["I","II","III","IV","V","VI","VII"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getScaleNotes(key: string, intervals: number[]): string[] {
  const root = ROOT_PITCH[key] ?? 0;

  // 7-note scales: assign one letter per degree — the only correct approach
  if (intervals.length === 7) {
    const li = ROOT_LETTER_IDX[key] ?? 0;
    return intervals.map((iv, i) => {
      const pc     = (root + iv) % 12;
      const letter = LETTERS[(li + i) % 7];
      return spellNote(pc, letter);
    });
  }

  // 5-note pentatonic / 6-note whole-tone / 8-note diminished:
  // No single-letter-per-degree rule applies. Use sharp/flat based on root,
  // but prefer flat names for the diminished scale (more jazz-conventional).
  const preferFlats = USE_FLATS.has(key) || intervals.length === 8;
  const names = preferFlats ? NOTE_FLAT : NOTE_SHARP;
  return intervals.map(iv => names[(root + iv) % 12]);
}

function getStepPattern(intervals: number[]): string {
  const steps: string[] = [];
  for (let i = 0; i < intervals.length; i++) {
    const next = i + 1 < intervals.length ? intervals[i + 1] : 12;
    const diff = next - intervals[i];
    if (diff === 2) steps.push("W");
    else if (diff === 1) steps.push("H");
    else if (diff === 3) steps.push("W+H");
    else steps.push(`(${diff})`);
  }
  return steps.join(" · ");
}

function getDiatonicChords(key: string, scaleType: string) {
  const qualities = DIATONIC_QUALITIES[scaleType];
  if (!qualities) return [];
  const intervals = SCALE_INTERVALS[scaleType];
  const root = ROOT_PITCH[key] ?? 0;
  const names = USE_FLATS.has(key) ? NOTE_FLAT : NOTE_SHARP;

  return qualities.map((q, i) => {
    const degreeRoot = names[(root + intervals[i]) % 12];
    const numeral = ROMAN[i];
    const isMinor = q === "minor" || q === "dim";
    const roman = isMinor
      ? numeral.toLowerCase() + (q === "dim" ? "°" : "")
      : numeral + (q === "aug" ? "+" : "");
    const suffix = q === "minor" ? "m" : q === "dim" ? "dim" : q === "aug" ? "+" : "";
    return { roman, label: degreeRoot + suffix, quality: q };
  });
}

// ─── Audio ────────────────────────────────────────────────────────────────────

function playScaleAudio(
  key: string,
  intervals: number[],
  onDone: () => void,
): void {
  const rootMidi = ROOT_MIDI[key] ?? 60;
  withSharedAudioContext("scales", (ctx) => {
    const { volume } = getAudioSettings();
    const noteDelay = 0.28;
    const allIntervals = [...intervals, 12]; // add octave at end

    allIntervals.forEach((iv, i) => {
      const freq = 440 * Math.pow(2, (rootMidi + iv - 69) / 12);
      const t = ctx.currentTime + i * noteDelay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28 * volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.start(t);
      osc.stop(t + 0.46);
    });

    setTimeout(onDone, allIntervals.length * noteDelay * 1000 + 400);
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Scales() {
  const [scaleKey, setScaleKey] = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [showNoteNames, setShowNoteNames] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const intervals    = SCALE_INTERVALS[scaleType] ?? [0,2,4,5,7,9,11];
  const degreeLabels = SCALE_DEGREE_LABELS[scaleType] ?? [];
  const scaleNotes   = useMemo(() => getScaleNotes(scaleKey, intervals), [scaleKey, intervals]);
  const stepPattern  = getStepPattern(intervals);
  const diatonic     = getDiatonicChords(scaleKey, scaleType);

  // Map pitch-class → spelled note name so the fretboard shows e.g. "Bb" not "A#"
  const spelledNoteMap = useMemo(() => {
    const root = ROOT_PITCH[scaleKey] ?? 0;
    const m = new Map<number, string>();
    intervals.forEach((iv, i) => m.set((root + iv) % 12, scaleNotes[i]));
    return m;
  }, [scaleKey, intervals, scaleNotes]);

  const handlePlay = useCallback(() => {
    if (playing) return;
    setPlaying(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playScaleAudio(scaleKey, intervals, () => setPlaying(false));
  }, [playing, scaleKey, intervals]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Scale Practice</p>

          {/* Key selector */}
          <div className="flex flex-wrap gap-1 mb-2">
            {KEYS.map(k => (
              <button
                key={k}
                onClick={() => setScaleKey(k)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  scaleKey === k
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Scale type selector */}
          <div className="flex flex-wrap gap-1">
            {SCALE_TYPES.map(s => (
              <button
                key={s}
                onClick={() => setScaleType(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  scaleType === s
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {SCALE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Scale title + play */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {scaleKey} {SCALE_LABELS[scaleType]}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {SCALE_DESCRIPTIONS[scaleType]}
            </p>
          </div>
          <button
            onClick={handlePlay}
            disabled={playing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {playing
              ? <><Square className="w-3.5 h-3.5" />Playing…</>
              : <><Play  className="w-3.5 h-3.5" />Play</>
            }
          </button>
        </div>

        {/* Fretboard */}
        <div className="bg-card rounded-2xl p-3 border border-border/40">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Neck Map
            </span>
            <button
              onClick={() => setShowNoteNames(p => !p)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                showNoteNames
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {showNoteNames ? "Notes" : "Degrees"}
            </button>
          </div>

          <ScaleFretboard
            scaleKey={scaleKey}
            intervals={intervals}
            degreeLabels={degreeLabels}
            showNoteNames={showNoteNames}
            spelledNoteMap={spelledNoteMap}
          />

          {/* Legend */}
          <div className="flex items-center gap-4 mt-1 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">Root ({scaleKey})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-[10px] text-muted-foreground">Scale tones</span>
            </div>
          </div>
        </div>

        {/* Scale info */}
        <div className="bg-card rounded-2xl p-4 border border-border/40 space-y-3">
          {/* Notes */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
            <div className="flex flex-wrap gap-1.5">
              {scaleNotes.map((note, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {note}
                  <span className="font-mono text-[9px] ml-1 opacity-60">{degreeLabels[i]}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Step pattern */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Step Pattern <span className="font-normal normal-case">(W = whole, H = half)</span>
            </p>
            <p className="font-mono text-xs text-foreground tracking-wider">{stepPattern}</p>
          </div>
        </div>

        {/* Diatonic chords */}
        {diatonic.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border/40">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Diatonic Chords
            </p>
            <div className="grid grid-cols-7 gap-1">
              {diatonic.map((d, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                    i === 0 ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/60"
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${
                    i === 0 ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {d.roman}
                  </span>
                  <span className={`text-[11px] font-bold text-center leading-tight ${
                    i === 0 ? "text-foreground" : "text-foreground/80"
                  }`}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice tips */}
        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Practice Tips</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Start slow — play each note evenly, listening carefully</li>
            <li>• Memorize the <span className="text-foreground font-semibold">root note (1)</span> positions — they anchor every pattern</li>
            <li>• Practice ascending and descending across multiple octaves</li>
            <li>• Try improvising over a drone note on the root</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
