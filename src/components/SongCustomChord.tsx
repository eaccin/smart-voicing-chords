import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { SongChord } from "@/data/songs";
import type { ChordVoicing } from "@/data/chords";
import { saveCustomVoicing } from "@/data/chords";
import { createId } from "@/data/songs";

interface SongCustomChordProps {
  onPick: (chord: SongChord) => void;
  onBack: () => void;
}

const NUM_STRINGS = 6;
const NUM_FRETS = 5;
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

export default function SongCustomChord({ onPick, onBack }: SongCustomChordProps) {
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [chordName, setChordName] = useState("");
  const [startFret, setStartFret] = useState(1);

  function cyclePosition(stringIdx: number, fretIdx: number) {
    setPositions(prev => {
      const next = [...prev];
      const actualFret = startFret + fretIdx;
      if (next[stringIdx] === actualFret) {
        next[stringIdx] = -1; // muted
      } else {
        next[stringIdx] = actualFret;
      }
      return next;
    });
  }

  function toggleOpen(stringIdx: number) {
    setPositions(prev => {
      const next = [...prev];
      if (next[stringIdx] === 0) next[stringIdx] = -1;
      else if (next[stringIdx] === -1) next[stringIdx] = 0;
      else next[stringIdx] = 0;
      return next;
    });
  }

  function handleSave() {
    if (!chordName.trim()) return;
    const voicing: ChordVoicing = {
      name: chordName.trim(),
      positions,
      fingers: [0, 0, 0, 0, 0, 0],
      baseFret: startFret,
      barres: [],
    };
    const chordKey = `custom-${createId()}`;
    saveCustomVoicing({
      chordKey,
      suffix: "custom",
      label: chordName.trim(),
      voicing,
    });
    onPick({
      label: chordName.trim(),
      chordKey,
      suffix: "custom",
      voicingIndex: 0,
    });
  }

  // SVG rendering
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
    <div>
      <button onClick={onBack} className="text-sm text-primary mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Back to chords
      </button>

      <h3 className="text-lg font-bold text-foreground mb-3">Create Custom Chord</h3>

      <input
        type="text"
        value={chordName}
        onChange={e => setChordName(e.target.value)}
        placeholder="Chord name (e.g. G7alt)"
        className="w-full mb-4 px-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
      />

      {/* Start fret selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground">Start fret:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(f => (
            <button
              key={f}
              onClick={() => setStartFret(f)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                startFret === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive fretboard */}
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
            // Fretted position — show nothing at top unless it's outside the visible range
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

      <button
        onClick={handleSave}
        disabled={!chordName.trim()}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
      >
        Add {chordName || "Custom Chord"}
      </button>
    </div>
  );
}
