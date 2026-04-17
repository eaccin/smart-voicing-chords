import { useMemo } from "react";
import { getLeftHanded } from "@/hooks/useLeftHanded";

interface ScaleFretboardProps {
  scaleKey: string;
  intervals: number[];
  degreeLabels: string[];
  showNoteNames?: boolean;
  /** Properly-spelled note name for each pitch class in the scale (e.g. pc 10 → "Bb" not "A#") */
  spelledNoteMap?: Map<number, string>;
}

const ROOT_PITCH: Record<string, number> = {
  C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,
};
const NOTE_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NOTE_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const USE_FLATS  = new Set(["F","Bb","Eb","Ab","Db","Gb"]);

const OPEN_STRING_PITCHES = [4, 9, 2, 7, 11, 4]; // E A D G B e
const STRING_LABELS_TOP_TO_BOTTOM = ["e","B","G","D","A","E"];
const NUM_FRETS = 15;

export default function ScaleFretboard({
  scaleKey,
  intervals,
  degreeLabels,
  showNoteNames = false,
  spelledNoteMap,
}: ScaleFretboardProps) {
  const leftHanded = getLeftHanded();
  const rootPC = ROOT_PITCH[scaleKey] ?? 0;
  // Fallback chromatic names (used only when spelledNoteMap is absent)
  const fallbackNames = USE_FLATS.has(scaleKey) ? NOTE_FLAT : NOTE_SHARP;

  // Map pitch class → label
  const scalePCMap = useMemo(() => {
    const m = new Map<number, string>();
    intervals.forEach((iv, i) => {
      m.set((rootPC + iv) % 12, degreeLabels[i]);
    });
    return m;
  }, [rootPC, intervals, degreeLabels]);

  const fretW = 30;
  const stringH = 20;
  const padLeft = 24;
  const padTop = 16;
  const padBottom = 18;
  const numStrings = 6;
  const width = padLeft + NUM_FRETS * fretW + 8;
  const height = padTop + (numStrings - 1) * stringH + padBottom;
  const dotR = 7;

  const dots = useMemo(() => {
    const result: Array<{
      x: number; y: number; pc: number; isRoot: boolean; label: string;
    }> = [];
    for (let s = 0; s < numStrings; s++) {
      for (let f = 0; f <= NUM_FRETS; f++) {
        const pc = (OPEN_STRING_PITCHES[s] + f) % 12;
        if (!scalePCMap.has(pc)) continue;
        const displayString = numStrings - 1 - s; // e at top, E at bottom
        const displayFret   = leftHanded ? NUM_FRETS - f : f;
        const x = padLeft + displayFret * fretW - fretW / 2;
        const y = padTop + displayString * stringH;
        const noteLabel = spelledNoteMap?.get(pc) ?? fallbackNames[pc];
        const label = showNoteNames ? noteLabel : (scalePCMap.get(pc) ?? "");
        result.push({ x, y, pc, isRoot: pc === rootPC, label });
      }
    }
    return result;
  }, [scalePCMap, rootPC, leftHanded, showNoteNames, spelledNoteMap, fallbackNames]);

  const fretMarkers = [3, 5, 7, 9, 12, 15];

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[470px] max-w-[640px]"
      >
        {/* Nut */}
        <line
          x1={padLeft} y1={padTop}
          x2={padLeft} y2={padTop + (numStrings - 1) * stringH}
          stroke="hsl(var(--nut-color))" strokeWidth={4} strokeLinecap="round"
        />

        {/* Frets */}
        {Array.from({ length: NUM_FRETS }, (_, i) => (
          <line key={i}
            x1={padLeft + (i + 1) * fretW} y1={padTop}
            x2={padLeft + (i + 1) * fretW} y2={padTop + (numStrings - 1) * stringH}
            stroke="hsl(var(--fret-color))" strokeWidth={1.5}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line key={i}
            x1={padLeft} y1={padTop + i * stringH}
            x2={padLeft + NUM_FRETS * fretW} y2={padTop + i * stringH}
            stroke="hsl(var(--string-color))" strokeWidth={i < 3 ? 2 : 1.5}
          />
        ))}

        {/* Fret position markers */}
        {fretMarkers.map(f => (
          <circle key={f}
            cx={padLeft + f * fretW - fretW / 2}
            cy={padTop + (numStrings - 1) * stringH + 10}
            r={3} className="fill-muted-foreground/30"
          />
        ))}

        {/* String labels — e at top, E at bottom */}
        {STRING_LABELS_TOP_TO_BOTTOM.map((label, i) => (
          <text key={i} x={8} y={padTop + i * stringH + 4}
            className="fill-muted-foreground font-mono" fontSize={9} textAnchor="middle">
            {label}
          </text>
        ))}

        {/* Scale tone dots */}
        {dots.map((dot, i) => (
          <g key={i}>
            <circle cx={dot.x} cy={dot.y} r={dotR}
              className={dot.isRoot ? "fill-primary" : "fill-accent"} opacity={0.9}
            />
            <text
              x={dot.x} y={dot.y + 1}
              textAnchor="middle" dominantBaseline="central"
              className={dot.isRoot ? "fill-primary-foreground" : "fill-accent-foreground"}
              fontSize={dot.label.length > 2 ? 5 : 6.5}
              fontWeight="bold"
            >
              {dot.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
