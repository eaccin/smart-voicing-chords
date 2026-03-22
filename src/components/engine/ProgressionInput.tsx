import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, RotateCcw, Pencil, Wrench } from "lucide-react";
import type { ProgressionChord } from "@/engine/voicingEngine";
import { searchChords } from "@/engine/voicingEngine";
import type { SongChord } from "@/data/songs";
import SongCustomChord from "@/components/SongCustomChord";

interface ProgressionInputProps {
  progression: ProgressionChord[];
  onChange: (progression: ProgressionChord[]) => void;
}

export default function ProgressionInput({ progression, onChange }: ProgressionInputProps) {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchChords(query);

  function addChord(chord: { key: string; suffix: string; label: string }) {
    if (editingIndex !== null) {
      const updated = [...progression];
      updated[editingIndex] = { key: chord.key, suffix: chord.suffix, label: chord.label };
      onChange(updated);
      setEditingIndex(null);
    } else {
      onChange([...progression, { key: chord.key, suffix: chord.suffix, label: chord.label }]);
    }
    setQuery("");
    setShowSearch(false);
  }

  function removeChord(index: number) {
    onChange(progression.filter((_, i) => i !== index));
  }

  function editChord(index: number) {
    setEditingIndex(index);
    setQuery(progression[index].label);
    setShowSearch(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function openSearch() {
    setEditingIndex(null);
    setShowSearch(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleClear() {
    onChange([]);
    setShowSearch(false);
    setEditingIndex(null);
    setQuery("");
  }

  return (
    <div className="space-y-3">
      {/* Current progression chips */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        <AnimatePresence mode="popLayout">
          {progression.map((chord, i) => (
            <motion.div
              key={`${chord.label}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              layout
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg ${
                editingIndex === i
                  ? "bg-accent/20 border-accent/50"
                  : "bg-primary/15 border-primary/30"
              }`}
            >
              <span className="text-sm font-bold text-foreground">{chord.label}</span>
              {i < progression.length - 1 && (
                <span className="text-muted-foreground/50 text-xs ml-1">→</span>
              )}
              <button
                onClick={() => editChord(i)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-accent/20 text-muted-foreground hover:text-accent transition-colors"
                title="Edit chord"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => removeChord(i)}
                className="p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={openSearch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Add Chord</span>
        </button>

        {progression.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-destructive/50 text-muted-foreground hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Clear All</span>
          </button>
        )}
      </div>

      {/* Search dropdown */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border/50 rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={editingIndex !== null ? "Replace chord..." : "Search chords... (e.g. Dm7, G7, Cmaj7)"}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                onKeyDown={e => {
                  if (e.key === "Escape") { setShowSearch(false); setEditingIndex(null); }
                  if (e.key === "Enter" && results.length > 0) addChord(results[0]);
                }}
              />
              <button
                onClick={() => { setShowSearch(false); setEditingIndex(null); }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {editingIndex !== null && (
              <div className="px-3 py-1.5 bg-accent/10 text-xs text-accent font-medium">
                Replacing: {progression[editingIndex]?.label}
              </div>
            )}
            <div className="max-h-48 overflow-y-auto p-2">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {results.map((chord, i) => (
                  <button
                    key={`${chord.key}-${chord.suffix}-${i}`}
                    onClick={() => addChord(chord)}
                    className="px-2 py-1.5 rounded-lg text-xs font-bold text-foreground bg-secondary/50 hover:bg-primary/20 hover:text-primary transition-colors text-center"
                  >
                    {chord.label}
                  </button>
                ))}
              </div>
              {results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No chords found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
