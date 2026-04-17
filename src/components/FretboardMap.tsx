import { useMemo } from "react";
import { getLeftHanded } from "@/hooks/useLeftHanded";

interface FretboardMapProps {
  chordKey: string;
  suffix: string;
}

// Semitone intervals for each chord suffix
const CHORD_INTERVALS: Record<string, number[]> = {
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

const ROOT_PITCH: Record<string, number> = {
  C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,
};

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// Standard tuning open string pitches (low E to high e)
const OPEN_STRING_PITCHES = [4, 9, 2, 7, 11, 4]; // E A D G B E
const STRING_LABELS = ["E","A","D","G","B","e"];

const NUM_FRETS = 12;

export default function FretboardMap({ chordKey, suffix }: FretboardMapProps) {
  const leftHanded = getLeftHanded();

  const chordPCs = useMemo(() => {
    const root = ROOT_PITCH[chordKey] ?? 0;
    const intervals = CHORD_INTERVALS[suffix] ?? [0, 4, 7];
    return new Set(intervals.map(i => (root + i) % 12));
  }, [chordKey, suffix]);

  const rootPC = ROOT_PITCH[chordKey] ?? 0;

  // SVG layout
  const fretW = 32;
  const stringH = 20;
  const padLeft = 24;
  const padTop = 16;
  const padBottom = 18;
  const numStrings = 6;
  const width = padLeft + NUM_FRETS * fretW + 8;
  const height = padTop + (numStrings - 1) * stringH + padBottom;
  const dotR = 7;

  // Build dot data
  // Strings are always displayed with high e at top (row 0) and low E at bottom (row 5)
  // Left-handed only flips the fret order (horizontal mirror)
  const dots = useMemo(() => {
    const result: Array<{ x: number; y: number; pc: number; isRoot: boolean; noteName: string }> = [];
    for (let s = 0; s < numStrings; s++) {
      for (let f = 0; f <= NUM_FRETS; f++) {
        const pc = (OPEN_STRING_PITCHES[s] + f) % 12;
        if (chordPCs.has(pc)) {
          const displayString = numStrings - 1 - s; // always invert: e at top, E at bottom
          const displayFret = leftHanded ? NUM_FRETS - f : f;
          const x = padLeft + displayFret * fretW - fretW / 2;
          const y = padTop + displayString * stringH;
          result.push({ x, y, pc, isRoot: pc === rootPC, noteName: NOTE_NAMES[pc] });
        }
      }
    }
    return result;
  }, [chordPCs, rootPC, leftHanded]);

  // Fret markers
  const fretMarkers = [3, 5, 7, 9, 12];

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[420px] max-w-[560px]"
      >
        {/* Nut */}
        <line
          x1={padLeft} y1={padTop}
          x2={padLeft} y2={padTop + (numStrings - 1) * stringH}
          stroke="hsl(var(--nut-color))"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Frets */}
        {Array.from({ length: NUM_FRETS }, (_, i) => (
          <line
            key={i}
            x1={padLeft + (i + 1) * fretW} y1={padTop}
            x2={padLeft + (i + 1) * fretW} y2={padTop + (numStrings - 1) * stringH}
            stroke="hsl(var(--fret-color))"
            strokeWidth={1.5}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={i}
            x1={padLeft} y1={padTop + i * stringH}
            x2={padLeft + NUM_FRETS * fretW} y2={padTop + i * stringH}
            stroke="hsl(var(--string-color))"
            strokeWidth={i < 3 ? 2 : 1.5}
          />
        ))}

        {/* Fret position markers */}
        {fretMarkers.map(f => (
          <circle
            key={f}
            cx={padLeft + f * fretW - fretW / 2}
            cy={padTop + (numStrings - 1) * stringH + 10}
            r={3}
            className="fill-muted-foreground/30"
          />
        ))}

        {/* String labels — always e at top, E at bottom */}
        {[...STRING_LABELS].reverse().map((label, i) => (
          <text
            key={i}
            x={8}
            y={padTop + i * stringH + 4}
            className="fill-muted-foreground font-mono"
            fontSize={9}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* Chord tone dots */}
        {dots.map((dot, i) => (
          <g key={i}>
            <circle
              cx={dot.x}
              cy={dot.y}
              r={dotR}
              className={dot.isRoot ? "fill-primary" : "fill-accent"}
              opacity={0.9}
            />
            <text
              x={dot.x}
              y={dot.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className={dot.isRoot ? "fill-primary-foreground" : "fill-accent-foreground"}
              fontSize={7}
              fontWeight="bold"
            >
              {dot.noteName}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Root ({chordKey})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-[10px] text-muted-foreground">Chord tones</span>
        </div>
      </div>
    </div>
  );
}
