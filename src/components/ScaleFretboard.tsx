import { useMemo } from "react";
import { getLeftHanded } from "@/hooks/useLeftHanded";

interface ScaleFretboardProps {
  scaleKey: string;
  intervals: number[];
  degreeLabels: string[];
  showNoteNames?: boolean;
  /** Properly-spelled note name for each pitch class in the scale (e.g. pc 10 → "Bb" not "A#") */
  spelledNoteMap?: Map<number, string>;
  /** First fret to display (default 0 = open position) */
  fretMin?: number;
  /** Last fret to display (default 15 = full neck) */
  fretMax?: number;
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
  fretMin: fretMinProp,
  fretMax: fretMaxProp,
}: ScaleFretboardProps) {
  const leftHanded = getLeftHanded();
  const rootPC = ROOT_PITCH[scaleKey] ?? 0;
  const fallbackNames = USE_FLATS.has(scaleKey) ? NOTE_FLAT : NOTE_SHARP;

  const minF = fretMinProp ?? 0;
  const maxF = fretMaxProp ?? NUM_FRETS;

  // Visual slot count:
  //   minF=0 → slot 0 = open-string area (before nut), slot 1..maxF = fret slots
  //   minF>0 → slot 0 = before start line (unused), slot 1..(maxF-minF+1) = fret slots
  const visibleSlotCount = maxF - (minF > 0 ? minF - 1 : 0);

  // Map a fret number to its visual slot index (0-based from left)
  const slotOf = (f: number) => (minF > 0 ? f - minF + 1 : f);

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
  const padTop = minF > 0 ? 22 : 16;
  const padBottom = 18;
  const numStrings = 6;
  const width = padLeft + visibleSlotCount * fretW + 8;
  const height = padTop + (numStrings - 1) * stringH + padBottom;
  const dotR = 7;

  const dots = useMemo(() => {
    const result: Array<{
      x: number; y: number; pc: number; isRoot: boolean; label: string;
    }> = [];
    for (let s = 0; s < numStrings; s++) {
      for (let f = minF; f <= maxF; f++) {
        const pc = (OPEN_STRING_PITCHES[s] + f) % 12;
        if (!scalePCMap.has(pc)) continue;
        const displayString = numStrings - 1 - s;
        const slot = slotOf(f);
        const displaySlot = leftHanded ? visibleSlotCount - slot : slot;
        const x = padLeft + displaySlot * fretW - fretW / 2;
        const y = padTop + displayString * stringH;
        const noteLabel = spelledNoteMap?.get(pc) ?? fallbackNames[pc];
        const label = showNoteNames ? noteLabel : (scalePCMap.get(pc) ?? "");
        result.push({ x, y, pc, isRoot: pc === rootPC, label });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scalePCMap, rootPC, leftHanded, showNoteNames, spelledNoteMap, fallbackNames, minF, maxF, visibleSlotCount]);

  const fretMarkers = [3, 5, 7, 9, 12, 15].filter(f => f >= minF && f <= maxF);

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full max-w-[640px] ${visibleSlotCount >= 12 ? "min-w-[470px]" : ""}`}
      >
        {/* Nut — only for open position */}
        {minF === 0 && (
          <line
            x1={padLeft} y1={padTop}
            x2={padLeft} y2={padTop + (numStrings - 1) * stringH}
            stroke="hsl(var(--nut-color))" strokeWidth={4} strokeLinecap="round"
          />
        )}

        {/* Start-position indicator for non-open views */}
        {minF > 0 && (
          <>
            <line
              x1={padLeft} y1={padTop}
              x2={padLeft} y2={padTop + (numStrings - 1) * stringH}
              stroke="hsl(var(--fret-color))" strokeWidth={2} strokeLinecap="round"
            />
            <text
              x={padLeft + 3}
              y={padTop - 10}
              className="fill-muted-foreground font-mono"
              fontSize={8}
            >
              {minF}fr
            </text>
          </>
        )}

        {/* Frets */}
        {Array.from({ length: visibleSlotCount }, (_, i) => (
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
            x2={padLeft + visibleSlotCount * fretW} y2={padTop + i * stringH}
            stroke="hsl(var(--string-color))" strokeWidth={i < 3 ? 2 : 1.5}
          />
        ))}

        {/* Fret position markers */}
        {fretMarkers.map(f => {
          const slot = slotOf(f);
          const displaySlot = leftHanded ? visibleSlotCount - slot : slot;
          return (
            <circle key={f}
              cx={padLeft + displaySlot * fretW - fretW / 2}
              cy={padTop + (numStrings - 1) * stringH + 10}
              r={3} className="fill-muted-foreground/30"
            />
          );
        })}

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
