import { motion } from "framer-motion";
import type { ChordVoicing } from "@/data/chords";

interface ChordDiagramProps {
  voicing: ChordVoicing;
  size?: "sm" | "lg";
}

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

export default function ChordDiagram({ voicing, size = "lg" }: ChordDiagramProps) {
  const isLarge = size === "lg";
  const numFrets = 5;
  const numStrings = 6;

  // Calculate display range
  const playedFrets = voicing.positions.filter(p => p > 0);
  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 1;
  const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 5;
  
  let startFret = 1;
  if (maxFret > 5) {
    startFret = Math.max(1, minFret);
  } else if (minFret > 1 && maxFret - minFret < 5) {
    startFret = minFret;
  }
  const showNut = startFret === 1;

  // SVG dimensions
  const padding = isLarge ? 40 : 24;
  const topPadding = isLarge ? 36 : 20;
  const fretSpacing = isLarge ? 48 : 28;
  const stringSpacing = isLarge ? 36 : 20;
  const width = padding * 2 + (numStrings - 1) * stringSpacing;
  const height = topPadding + numFrets * fretSpacing + (isLarge ? 24 : 12);
  const fingerRadius = isLarge ? 14 : 8;

  const getStringX = (i: number) => padding + i * stringSpacing;
  const getFretY = (f: number) => topPadding + f * fretSpacing;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={isLarge ? "w-full max-w-[280px]" : "w-full max-w-[140px]"}
    >
      {/* Fret position indicator */}
      {!showNut && (
        <text
          x={padding - (isLarge ? 24 : 14)}
          y={getFretY(0) + fretSpacing / 2 + 5}
          className="fill-muted-foreground font-mono"
          fontSize={isLarge ? 14 : 10}
          textAnchor="middle"
        >
          {startFret}
        </text>
      )}

      {/* Nut or top line */}
      <line
        x1={padding}
        y1={getFretY(0)}
        x2={padding + (numStrings - 1) * stringSpacing}
        y2={getFretY(0)}
        stroke={showNut ? "hsl(var(--nut-color))" : "hsl(var(--fret-color))"}
        strokeWidth={showNut ? (isLarge ? 5 : 3) : (isLarge ? 2 : 1)}
        strokeLinecap="round"
      />

      {/* Frets */}
      {Array.from({ length: numFrets }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={padding}
          y1={getFretY(i + 1)}
          x2={padding + (numStrings - 1) * stringSpacing}
          y2={getFretY(i + 1)}
          stroke="hsl(var(--fret-color))"
          strokeWidth={isLarge ? 2 : 1}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: numStrings }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={getStringX(i)}
          y1={getFretY(0)}
          x2={getStringX(i)}
          y2={getFretY(numFrets)}
          stroke="hsl(var(--string-color))"
          strokeWidth={isLarge ? 2 : 1.5}
        />
      ))}

      {/* Barres */}
      {voicing.barres?.map((barre, i) => {
        const displayFret = barre.fret - startFret + 1;
        if (displayFret < 1 || displayFret > numFrets) return null;
        const fromIdx = 6 - barre.fromString;
        const toIdx = 6 - barre.toString;
        const x1 = getStringX(Math.min(fromIdx, toIdx));
        const x2 = getStringX(Math.max(fromIdx, toIdx));
        const y = getFretY(displayFret - 1) + fretSpacing / 2;
        return (
          <rect
            key={`barre-${i}`}
            x={x1 - fingerRadius}
            y={y - fingerRadius}
            width={x2 - x1 + fingerRadius * 2}
            height={fingerRadius * 2}
            rx={fingerRadius}
            className="fill-primary"
            style={{ filter: isLarge ? "drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))" : undefined }}
          />
        );
      })}

      {/* Finger positions & open/muted markers */}
      {voicing.positions.map((pos, stringIdx) => {
        const x = getStringX(stringIdx);

        if (pos === -1) {
          // Muted
          const y = getFretY(0) - (isLarge ? 16 : 10);
          const s = isLarge ? 7 : 4;
          return (
            <g key={`mark-${stringIdx}`}>
              <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke="hsl(var(--muted-foreground))" strokeWidth={isLarge ? 2.5 : 1.5} strokeLinecap="round" />
              <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke="hsl(var(--muted-foreground))" strokeWidth={isLarge ? 2.5 : 1.5} strokeLinecap="round" />
            </g>
          );
        }

        if (pos === 0) {
          // Open
          const y = getFretY(0) - (isLarge ? 16 : 10);
          return (
            <circle
              key={`mark-${stringIdx}`}
              cx={x}
              cy={y}
              r={isLarge ? 7 : 4}
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={isLarge ? 2 : 1.5}
            />
          );
        }

        // Fretted - check if covered by a barre
        const isCoveredByBarre = voicing.barres?.some(b => {
          const fromIdx = 6 - b.fromString;
          const toIdx = 6 - b.toString;
          return pos === b.fret && stringIdx >= Math.min(fromIdx, toIdx) && stringIdx <= Math.max(fromIdx, toIdx);
        });
        if (isCoveredByBarre) return null;

        const displayFret = pos - startFret + 1;
        if (displayFret < 1 || displayFret > numFrets) return null;
        const y = getFretY(displayFret - 1) + fretSpacing / 2;

        return (
          <motion.g
            key={`finger-${stringIdx}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: stringIdx * 0.05, duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <circle
              cx={x}
              cy={y}
              r={fingerRadius}
              className="fill-primary"
              style={{ filter: isLarge ? "drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))" : undefined }}
            />
            {isLarge && voicing.fingers[stringIdx] > 0 && (
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-primary-foreground font-mono font-medium"
                fontSize={12}
              >
                {voicing.fingers[stringIdx]}
              </text>
            )}
          </motion.g>
        );
      })}

      {/* String names at bottom */}
      {isLarge && STRING_NAMES.map((name, i) => (
        <text
          key={`name-${i}`}
          x={getStringX(i)}
          y={getFretY(numFrets) + 20}
          textAnchor="middle"
          className="fill-muted-foreground font-mono"
          fontSize={11}
        >
          {name}
        </text>
      ))}
    </svg>
  );
}
