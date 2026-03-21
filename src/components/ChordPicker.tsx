import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, PenTool } from "lucide-react";
import { getAllChordsWithCustom, rootNotes, suffixes, suffixLabels } from "@/data/chords";
import type { SongChord } from "@/data/songs";
import ChordDiagram from "./ChordDiagram";
import SongCustomChord from "./SongCustomChord";

interface ChordPickerProps {
  onPick: (chord: SongChord) => void;
  onClose: () => void;
}

export default function ChordPicker({ onPick, onClose }: ChordPickerProps) {
  const [query, setQuery] = useState("");
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);
  const [selectedVoicing, setSelectedVoicing] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const allChords = useMemo(() => getAllChordsWithCustom(), []);

  const filtered = useMemo(() => {
    let r = allChords;
    if (query) {
      const q = query.toLowerCase().trim();
      r = r.filter(c =>
        c.label.toLowerCase().includes(q) ||
        `${c.key}${c.suffix}`.toLowerCase().includes(q)
      );
    }
    if (activeRoot) r = r.filter(c => c.key === activeRoot);
    if (activeSuffix) r = r.filter(c => c.suffix === activeSuffix);
    return r;
  }, [query, activeRoot, activeSuffix, allChords]);

  const selectedChord = selectedChordId
    ? allChords.find(c => `${c.key}-${c.suffix}` === selectedChordId) ?? null
    : null;

  function handleConfirm() {
    if (!selectedChord) return;
    onPick({
      label: selectedChord.label,
      chordKey: selectedChord.key,
      suffix: selectedChord.suffix,
      voicingIndex: selectedVoicing,
    });
    setSelectedChordId(null);
    setSelectedVoicing(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Pick a Chord</h2>
            <button onClick={onClose} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chords…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2">
            {rootNotes.map(r => (
              <button
                key={r}
                onClick={() => setActiveRoot(prev => prev === r ? null : r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeRoot === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {suffixes.map(s => (
              <button
                key={s}
                onClick={() => setActiveSuffix(prev => prev === s ? null : s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  activeSuffix === s ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {suffixLabels[s] || s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chord grid or voicing selector */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto">
          {showCustom ? (
            <SongCustomChord
              onPick={(chord) => { onPick(chord); setShowCustom(false); }}
              onBack={() => setShowCustom(false)}
            />
          ) : selectedChord ? (
            <div>
              <button
                onClick={() => { setSelectedChordId(null); setSelectedVoicing(0); }}
                className="text-sm text-primary mb-4 flex items-center gap-1"
              >
                ← Back to chords
              </button>
              <h3 className="text-2xl font-bold text-foreground mb-4">{selectedChord.label}</h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedChord.voicings.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVoicing(i)}
                    className={`p-3 rounded-xl border-2 transition-colors ${
                      i === selectedVoicing
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-2">{v.name}</p>
                    <ChordDiagram voicing={v} size="sm" />
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Add {selectedChord.label}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Custom chord button */}
              <button
                onClick={() => setShowCustom(true)}
                className="w-full mb-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/20 border border-accent/30 text-accent-foreground hover:bg-accent/30 transition-colors"
              >
                <PenTool className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Create Custom Chord</span>
                <span className="text-xs text-muted-foreground ml-auto">Draw your own voicing</span>
              </button>

              <div className="grid grid-cols-4 gap-2">
                {filtered.map(c => {
                  const id = `${c.key}-${c.suffix}`;
                  return (
                    <button
                      key={id}
                      onClick={() => { setSelectedChordId(id); setSelectedVoicing(0); }}
                      className="p-3 rounded-xl bg-card hover:bg-surface-elevated transition-colors text-center"
                    >
                      <p className="text-sm font-bold text-foreground">{c.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.voicings.length} voicing{c.voicings.length !== 1 ? "s" : ""}</p>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="col-span-4 text-center py-12 text-muted-foreground text-sm">No chords found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
