import { useState } from "react";
import { ChevronLeft, Sparkles } from "lucide-react";
import type { SongChord } from "@/data/songs";
import type { ChordVoicing } from "@/data/chords";
import { saveCustomVoicing } from "@/data/chords";
import { createId } from "@/data/songs";
import { detectChordFromPositions, type DetectedChord } from "@/lib/chordDetection";
import CustomChordDiagram from "@/components/CustomChordDiagram";

interface SongCustomChordProps {
  onPick: (chord: SongChord) => void;
  onBack: () => void;
}

export default function SongCustomChord({ onPick, onBack }: SongCustomChordProps) {
  const [positions, setPositions] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [chordName, setChordName] = useState("");
  const [startFret, setStartFret] = useState(1);
  const [suggestions, setSuggestions] = useState<DetectedChord[]>([]);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  function handlePositionChange(newPositions: number[]) {
    setPositions(newPositions);
    setSuggestions([]);
    setSuggestionIdx(0);
  }

  function handleGenerate() {
    const detected = detectChordFromPositions(positions);
    setSuggestions(detected);
    setSuggestionIdx(0);
    if (detected.length > 0) {
      setChordName(detected[0].label);
    }
  }

  function handleNextSuggestion() {
    if (suggestions.length === 0) return;
    const next = (suggestionIdx + 1) % suggestions.length;
    setSuggestionIdx(next);
    setChordName(suggestions[next].label);
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
        className="w-full mb-3 px-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
      />

      {/* Generate / cycle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGenerate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/20 text-accent hover:bg-accent/30 text-sm font-semibold transition-colors"
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
              onClick={() => { setSuggestionIdx(i); setChordName(s.label); }}
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
      <CustomChordDiagram
        positions={positions}
        startFret={startFret}
        onPositionChange={handlePositionChange}
      />

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
