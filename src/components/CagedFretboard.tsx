import { useMemo } from "react";
import { getLeftHanded } from "@/hooks/useLeftHanded";
import { allChordToneDots, shapeFretDots, ROOT_PITCH } from "@/lib/caged";
import type { ChordVoicing } from "@/data/chords";

interface CagedFretboardProps {
  chordKey: string;
  voicing: ChordVoicing;
  barreFret: number;
}

const NUM_FRETS = 15;
const NUM_STRINGS = 6;
const STRING_LABELS = ["E","A","D","G","B","e"];

export default function CagedFretboard({ chordKey, voicing, barreFret }: CagedFretboardProps) {
  const leftHanded = getLeftHanded();
  const rootPitch = ROOT_PITCH[chordKey] ?? 0;

  const bgDots = useMemo(() => allChordToneDots(chordKey, NUM_FRETS), [chordKey]);
  const shapeDots = useMemo(() => shapeFretDots(voicing, rootPitch), [voicing, rootPitch]);

  // Fast lookup for which frets belong to the active shape
  const shapeKey = useMemo(
    () => new Set(shapeDots.map(d => `${d.stringIdx}:${d.fret}`)),
    [shapeDots],
  );

  // Layout
  const fretW = 30;
  const stringH = 20;
  const padLeft = 24;
  const padTop = 16;
  const padBottom = 22;
  const width = padLeft + NUM_FRETS * fretW + 8;
  const height = padTop + (NUM_STRINGS - 1) * stringH + padBottom;
  const dotR = 8;

  const displayFretX = (f: number) =>
    padLeft + (leftHanded ? NUM_FRETS - f : f) * fretW - fretW / 2;
  // Strings shown with high e at top (row 0), low E at bottom (row 5)
  const stringY = (stringIdx: number) =>
    padTop + (NUM_STRINGS - 1 - stringIdx) * stringH;

  const fretMarkers = [3, 5, 7, 9, 12, 15];

  // Barre visual: a translucent vertical band at the barre fret
  const barreX = barreFret > 0 ? displayFretX(barreFret) : null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[520px] max-w-[640px]"
      >
        {/* Nut */}
        <line
          x1={leftHanded ? padLeft + NUM_FRETS * fretW : padLeft}
          y1={padTop}
          x2={leftHanded ? padLeft + NUM_FRETS * fretW : padLeft}
          y2={padTop + (NUM_STRINGS - 1) * stringH}
          stroke="hsl(var(--nut-color))"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Frets */}
        {Array.from({ length: NUM_FRETS }, (_, i) => (
          <line
            key={i}
            x1={padLeft + (i + 1) * fretW}
            y1={padTop}
            x2={padLeft + (i + 1) * fretW}
            y2={padTop + (NUM_STRINGS - 1) * stringH}
            stroke="hsl(var(--fret-color))"
            strokeWidth={1.5}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => (
          <line
            key={i}
            x1={padLeft}
            y1={padTop + i * stringH}
            x2={padLeft + NUM_FRETS * fretW}
            y2={padTop + i * stringH}
            stroke="hsl(var(--string-color))"
            strokeWidth={i < 3 ? 2 : 1.5}
          />
        ))}

        {/* Fret position markers */}
        {fretMarkers.map(f => (
          <text
            key={f}
            x={displayFretX(f)}
            y={padTop + (NUM_STRINGS - 1) * stringH + 15}
            textAnchor="middle"
            className="fill-muted-foreground/60 font-mono"
            fontSize={9}
          >
            {f}
          </text>
        ))}

        {/* String labels — e at top, E at bottom */}
        {[...STRING_LABELS].reverse().map((label, i) => (
          <text
            key={i}
            x={leftHanded ? width - 10 : 10}
            y={padTop + i * stringH + 4}
            className="fill-muted-foreground font-mono"
            fontSize={9}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* Barre indicator */}
        {barreX !== null && (
          <rect
            x={barreX - fretW / 2 + 2}
            y={padTop - 4}
            width={fretW - 4}
            height={(NUM_STRINGS - 1) * stringH + 8}
            rx={6}
            className="fill-primary/10"
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
        )}

        {/* Background dots — all chord tones across the neck, dimmed */}
        {bgDots.map((dot, i) => {
          const inShape = shapeKey.has(`${dot.stringIdx}:${dot.fret}`);
          if (inShape) return null; // drawn in foreground layer
          return (
            <circle
              key={`bg-${i}`}
              cx={displayFretX(dot.fret)}
              cy={stringY(dot.stringIdx)}
              r={dotR - 2}
              className={dot.isRoot ? "fill-primary/20" : "fill-accent/15"}
            />
          );
        })}

        {/* Foreground dots — active CAGED shape, bright */}
        {shapeDots.map((dot, i) => (
          <g key={`fg-${i}`}>
            <circle
              cx={displayFretX(dot.fret)}
              cy={stringY(dot.stringIdx)}
              r={dotR}
              className={dot.isRoot ? "fill-primary" : "fill-accent"}
              style={{ filter: "drop-shadow(0 0 6px rgba(59,130,246,0.35))" }}
            />
            <text
              x={displayFretX(dot.fret)}
              y={stringY(dot.stringIdx) + 1}
              textAnchor="middle"
              dominantBaseline="central"
              className={dot.isRoot ? "fill-primary-foreground" : "fill-accent-foreground"}
              fontSize={8}
              fontWeight="bold"
            >
              {dot.noteName}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Root ({chordKey})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-[10px] text-muted-foreground">Shape chord tone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent/20" />
          <span className="text-[10px] text-muted-foreground">Other positions</span>
        </div>
      </div>
    </div>
  );
}
