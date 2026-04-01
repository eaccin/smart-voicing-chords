/**
 * Interactive fretboard diagram for custom chord creation.
 * Clicking an active dot removes it. Clicking empty cell places a dot.
 */

const NUM_STRINGS = 6;
const NUM_FRETS = 5;
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

interface CustomChordDiagramProps {
  positions: number[];
  startFret: number;
  onPositionChange: (positions: number[]) => void;
}

export default function CustomChordDiagram({ positions, startFret, onPositionChange }: CustomChordDiagramProps) {
  function cyclePosition(stringIdx: number, fretIdx: number) {
    const next = [...positions];
    const actualFret = startFret + fretIdx;
    // If already active at this fret, remove it (set to muted)
    if (next[stringIdx] === actualFret) {
      next[stringIdx] = -1;
    } else {
      next[stringIdx] = actualFret;
    }
    onPositionChange(next);
  }

  function toggleOpen(stringIdx: number) {
    const next = [...positions];
    if (next[stringIdx] === 0) next[stringIdx] = -1;
    else if (next[stringIdx] === -1) next[stringIdx] = 0;
    else next[stringIdx] = 0;
    onPositionChange(next);
  }

  const padding = 40;
  const topPadding = 36;
  const fretSpacing = 48;
  const stringSpacing = 36;
  const width = padding * 2 + (NUM_STRINGS - 1) * stringSpacing;
  const height = topPadding + NUM_FRETS * fretSpacing + 24;
  const fingerRadius = 14;
  const getStringX = (i: number) => padding + i * stringSpacing;
  const getFretY = (f: number) => topPadding + f * fretSpacing;
  const showNut = startFret === 1;

  return (
    <div className="flex justify-center mb-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px]">
        {/* Fret position indicator */}
        {!showNut && (
          <text x={padding - 24} y={getFretY(0) + fretSpacing / 2 + 5} className="fill-muted-foreground font-mono" fontSize={14} textAnchor="middle">
            {startFret}
          </text>
        )}

        {/* Nut / top line */}
        <line x1={padding} y1={getFretY(0)} x2={padding + (NUM_STRINGS - 1) * stringSpacing} y2={getFretY(0)}
          stroke={showNut ? "hsl(var(--nut-color, var(--foreground)))" : "hsl(var(--fret-color, var(--border)))"}
          strokeWidth={showNut ? 5 : 2} strokeLinecap="round" />

        {/* Frets */}
        {Array.from({ length: NUM_FRETS }, (_, i) => (
          <line key={i} x1={padding} y1={getFretY(i + 1)} x2={padding + (NUM_STRINGS - 1) * stringSpacing} y2={getFretY(i + 1)}
            stroke="hsl(var(--fret-color, var(--border)))" strokeWidth={2} />
        ))}

        {/* Strings */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => (
          <line key={i} x1={getStringX(i)} y1={getFretY(0)} x2={getStringX(i)} y2={getFretY(NUM_FRETS)}
            stroke="hsl(var(--string-color, var(--muted-foreground)))" strokeWidth={2} />
        ))}

        {/* Tap targets per fret cell */}
        {Array.from({ length: NUM_FRETS }, (_, fretIdx) =>
          Array.from({ length: NUM_STRINGS }, (_, stringIdx) => {
            const x = getStringX(stringIdx);
            const y = getFretY(fretIdx) + fretSpacing / 2;
            const actualFret = startFret + fretIdx;
            const isActive = positions[stringIdx] === actualFret;
            return (
              <g key={`${fretIdx}-${stringIdx}`} onClick={() => cyclePosition(stringIdx, fretIdx)} className="cursor-pointer">
                <rect x={x - stringSpacing / 2} y={y - fretSpacing / 2} width={stringSpacing} height={fretSpacing} fill="transparent" />
                {isActive && (
                  <circle cx={x} cy={y} r={fingerRadius} className="fill-primary" />
                )}
              </g>
            );
          })
        )}

        {/* Open/muted markers at top */}
        {positions.map((pos, i) => {
          const x = getStringX(i);
          const y = getFretY(0) - 16;
          if (pos === 0) {
            return (
              <g key={`top-${i}`} onClick={() => toggleOpen(i)} className="cursor-pointer">
                <circle cx={x} cy={y} r={10} fill="transparent" />
                <circle cx={x} cy={y} r={7} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
              </g>
            );
          }
          if (pos === -1) {
            const s = 7;
            return (
              <g key={`top-${i}`} onClick={() => toggleOpen(i)} className="cursor-pointer">
                <circle cx={x} cy={y} r={10} fill="transparent" />
                <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke="hsl(var(--muted-foreground))" strokeWidth={2.5} strokeLinecap="round" />
                <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke="hsl(var(--muted-foreground))" strokeWidth={2.5} strokeLinecap="round" />
              </g>
            );
          }
          return null;
        })}

        {/* String names */}
        {STRING_NAMES.map((name, i) => (
          <text key={i} x={getStringX(i)} y={getFretY(NUM_FRETS) + 20} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize={11}>
            {name}
          </text>
        ))}
      </svg>
    </div>
  );
}
