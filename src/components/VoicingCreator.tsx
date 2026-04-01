import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Sparkles } from "lucide-react";
import { saveCustomVoicing } from "@/data/chords";
import { detectChordFromPositions, type DetectedChord } from "@/lib/chordDetection";
import CustomChordDiagram from "@/components/CustomChordDiagram";

interface VoicingCreatorProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function VoicingCreator({ onClose, onSaved }: VoicingCreatorProps) {
  const [voicingName, setVoicingName] = useState("Custom");
  const [chordLabel, setChordLabel] = useState("");
  const [positions, setPositions] = useState<number[]>([-1, -1, -1, -1, -1, -1]);
  const [startFret, setStartFret] = useState(1);
  const [suggestions, setSuggestions] = useState<DetectedChord[]>([]);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  function handlePositionChange(newPositions: number[]) {
    setPositions(newPositions);
    setSuggestions([]);
    setSuggestionIdx(0);
  }

  function handleDetect() {
    const detected = detectChordFromPositions(positions);
    setSuggestions(detected);
    setSuggestionIdx(0);
    if (detected.length > 0) {
      setChordLabel(detected[0].label);
    }
  }

  function handleNextSuggestion() {
    if (suggestions.length === 0) return;
    const next = (suggestionIdx + 1) % suggestions.length;
    setSuggestionIdx(next);
    setChordLabel(suggestions[next].label);
  }

  function handlePickSuggestion(i: number) {
    setSuggestionIdx(i);
    setChordLabel(suggestions[i].label);
  }

  // Parse label into key+suffix for saving
  function parseLabel(label: string): { key: string; suffix: string } {
    // Handle slash chords: e.g. "Am7/G"
    const slashIdx = label.indexOf("/");
    const mainPart = slashIdx > 0 ? label.substring(0, slashIdx) : label;
    const bassPart = slashIdx > 0 ? label.substring(slashIdx) : "";

    // Extract root (1 or 2 chars)
    let root = mainPart[0] || "C";
    let suffix = mainPart.substring(1);
    if (mainPart.length >= 2 && (mainPart[1] === "#" || mainPart[1] === "b")) {
      root = mainPart.substring(0, 2);
      suffix = mainPart.substring(2);
    }
    if (!suffix) suffix = "major";

    return { key: root, suffix: suffix + bassPart };
  }

  const handleSave = () => {
    if (positions.every(p => p === -1) || !chordLabel.trim()) return;
    const { key, suffix } = parseLabel(chordLabel.trim());

    saveCustomVoicing({
      chordKey: key,
      suffix,
      label: chordLabel.trim(),
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

        {/* Chord name input */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Chord Name</p>
          <input
            type="text"
            value={chordLabel}
            onChange={e => setChordLabel(e.target.value)}
            placeholder="e.g. Am7, G7/B, Cmaj9 — or use Detect"
            className="w-full px-3 py-2 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Detect + cycle */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleDetect}
            disabled={positions.every(p => p === -1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/20 text-accent-foreground hover:bg-accent/30 text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            Detect Chord
          </button>
          {suggestions.length > 1 && (
            <button
              onClick={handleNextSuggestion}
              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              Next ({suggestionIdx + 1}/{suggestions.length})
            </button>
          )}
        </div>

        {/* Suggestion chips */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {suggestions.map((s, i) => (
              <button
                key={s.label}
                onClick={() => handlePickSuggestion(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  i === suggestionIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Voicing name */}
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

        {/* Start fret selector */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground">Start fret:</span>
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(f => (
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

        {/* Chord label display */}
        {chordLabel && (
          <div className="text-center mb-2">
            <span className="text-3xl font-semibold tracking-tighter text-foreground">{chordLabel}</span>
          </div>
        )}

        {/* Interactive fretboard */}
        <div className="mb-3">
          <CustomChordDiagram
            positions={positions}
            startFret={startFret}
            onPositionChange={handlePositionChange}
          />
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
          disabled={positions.every(p => p === -1) || !chordLabel.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Save className="w-4 h-4" />
          Save {chordLabel || "Voicing"}
        </button>
      </div>
    </motion.div>
  );
}
