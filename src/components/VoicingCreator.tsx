import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save } from "lucide-react";
import { rootNotes, suffixes, suffixLabels, saveCustomVoicing } from "@/data/chords";

interface VoicingCreatorProps {
  onClose: () => void;
  onSaved: () => void;
}

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
const NUM_FRETS = 5;

export default function VoicingCreator({ onClose, onSaved }: VoicingCreatorProps) {
  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedSuffix, setSelectedSuffix] = useState("major");
  const [voicingName, setVoicingName] = useState("Custom");
  const [positions, setPositions] = useState<number[]>([-1, -1, -1, -1, -1, -1]);
  const [startFret, setStartFret] = useState(1);

  const label = selectedSuffix === "major" ? selectedRoot : `${selectedRoot}${selectedSuffix}`;

  const handleCellTap = (stringIdx: number, fretIdx: number) => {
    const newPositions = [...positions];
    const fretValue = startFret + fretIdx;

    if (positions[stringIdx] === fretValue) {
      // Toggle off → muted
      newPositions[stringIdx] = -1;
    } else {
      newPositions[stringIdx] = fretValue;
    }
    setPositions(newPositions);
  };

  const handleOpenToggle = (stringIdx: number) => {
    const newPositions = [...positions];
    if (positions[stringIdx] === 0) {
      newPositions[stringIdx] = -1;
    } else if (positions[stringIdx] === -1) {
      newPositions[stringIdx] = 0;
    } else {
      newPositions[stringIdx] = 0;
    }
    setPositions(newPositions);
  };

  const handleSave = () => {
    if (positions.every(p => p === -1)) return;

    saveCustomVoicing({
      chordKey: selectedRoot,
      suffix: selectedSuffix,
      label,
      voicing: {
        name: voicingName || "Custom",
        positions,
        fingers: positions.map(() => 0),
        baseFret: 1,
        isCustom: true,
      },
    });
    onSaved();
    onClose();
  };

  const clearAll = () => setPositions([-1, -1, -1, -1, -1, -1]);

  // Diagram layout
  const padding = 40;
  const topPadding = 36;
  const fretSpacing = 48;
  const stringSpacing = 36;
  const width = padding * 2 + 5 * stringSpacing;
  const height = topPadding + NUM_FRETS * fretSpacing + 24;
  const fingerRadius = 14;

  const getStringX = (i: number) => padding + i * stringSpacing;
  const getFretY = (f: number) => topPadding + f * fretSpacing;
  const showNut = startFret === 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
    >
      <div className="max-w-lg mx-auto px-4 py-4 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tighter text-foreground">
            Create Voicing
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Root selector */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Root Note</p>
          <div className="flex gap-1.5 flex-wrap">
            {rootNotes.map(root => (
              <button
                key={root}
                onClick={() => setSelectedRoot(root)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedRoot === root
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {root}
              </button>
            ))}
          </div>
        </div>

        {/* Suffix selector */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Type</p>
          <div className="flex gap-1.5 flex-wrap">
            {suffixes.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSuffix(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedSuffix === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {suffixLabels[s] || s}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Voicing Name</p>
          <input
            type="text"
            value={voicingName}
            onChange={e => setVoicingName(e.target.value)}
            placeholder="e.g. Open, Barre 5th"
            className="w-full px-3 py-2 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Fret range */}
        <div className="mb-3 flex items-center gap-3">
          <p className="text-xs text-muted-foreground font-medium">Start Fret</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStartFret(Math.max(1, startFret - 1))}
              className="w-8 h-8 rounded-lg bg-secondary text-foreground font-semibold text-sm flex items-center justify-center"
            >
              −
            </button>
            <span className="text-foreground font-mono text-sm w-6 text-center">{startFret}</span>
            <button
              onClick={() => setStartFret(Math.min(17, startFret + 1))}
              className="w-8 h-8 rounded-lg bg-secondary text-foreground font-semibold text-sm flex items-center justify-center"
            >
              +
            </button>
          </div>
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Chord label */}
        <div className="text-center mb-2">
          <span className="text-3xl font-semibold tracking-tighter text-foreground">{label}</span>
        </div>

        {/* Interactive fretboard */}
        <div className="flex justify-center mb-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px]">
            {/* Fret position */}
            {!showNut && (
              <text x={padding - 24} y={getFretY(0) + fretSpacing / 2 + 5} className="fill-muted-foreground font-mono" fontSize={14} textAnchor="middle">
                {startFret}
              </text>
            )}

            {/* Nut */}
            <line x1={padding} y1={getFretY(0)} x2={padding + 5 * stringSpacing} y2={getFretY(0)}
              stroke={showNut ? "hsl(var(--nut-color))" : "hsl(var(--fret-color))"}
              strokeWidth={showNut ? 5 : 2} strokeLinecap="round" />

            {/* Frets */}
            {Array.from({ length: NUM_FRETS }, (_, i) => (
              <line key={i} x1={padding} y1={getFretY(i + 1)} x2={padding + 5 * stringSpacing} y2={getFretY(i + 1)}
                stroke="hsl(var(--fret-color))" strokeWidth={2} />
            ))}

            {/* Strings */}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={getStringX(i)} y1={getFretY(0)} x2={getStringX(i)} y2={getFretY(NUM_FRETS)}
                stroke="hsl(var(--string-color))" strokeWidth={2} />
            ))}

            {/* Tap zones (invisible rects for each cell) */}
            {Array.from({ length: 6 }, (_, si) =>
              Array.from({ length: NUM_FRETS }, (_, fi) => {
                const x = getStringX(si) - stringSpacing / 2;
                const y = getFretY(fi);
                return (
                  <rect key={`tap-${si}-${fi}`} x={x} y={y} width={stringSpacing} height={fretSpacing}
                    fill="transparent" className="cursor-pointer" onClick={() => handleCellTap(si, fi)} />
                );
              })
            )}

            {/* Open/muted toggle zones */}
            {Array.from({ length: 6 }, (_, si) => (
              <rect key={`top-${si}`} x={getStringX(si) - stringSpacing / 2} y={0} width={stringSpacing} height={topPadding - 2}
                fill="transparent" className="cursor-pointer" onClick={() => handleOpenToggle(si)} />
            ))}

            {/* Display markers */}
            {positions.map((pos, si) => {
              const x = getStringX(si);
              if (pos === -1) {
                const y = getFretY(0) - 16;
                return (
                  <g key={`m-${si}`}>
                    <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} stroke="hsl(var(--muted-foreground))" strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} stroke="hsl(var(--muted-foreground))" strokeWidth={2.5} strokeLinecap="round" />
                  </g>
                );
              }
              if (pos === 0) {
                return (
                  <circle key={`m-${si}`} cx={x} cy={getFretY(0) - 16} r={7}
                    fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                );
              }
              const displayFret = pos - startFret + 1;
              if (displayFret < 1 || displayFret > NUM_FRETS) return null;
              const y = getFretY(displayFret - 1) + fretSpacing / 2;
              return (
                <circle key={`m-${si}`} cx={x} cy={y} r={fingerRadius}
                  className="fill-primary" style={{ filter: "drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))" }} />
              );
            })}

            {/* String names */}
            {STRING_NAMES.map((name, i) => (
              <text key={i} x={getStringX(i)} y={getFretY(NUM_FRETS) + 20} textAnchor="middle"
                className="fill-muted-foreground font-mono" fontSize={11}>{name}</text>
            ))}
          </svg>
        </div>

        {/* Positions readout */}
        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground font-mono tracking-wide">
            {positions.map(p => p === -1 ? "x" : p.toString()).join(" · ")}
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={positions.every(p => p === -1)}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Save className="w-4 h-4" />
          Save Voicing
        </button>
      </div>
    </motion.div>
  );
}
