import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Guitar, Plus, Volume2 } from "lucide-react";
import { getAllChordsWithCustom, searchChords, rootNotes, suffixes, suffixLabels } from "@/data/chords";
import type { Chord } from "@/data/chords";
import ChordDiagram from "@/components/ChordDiagram";
import VoicingCreator from "@/components/VoicingCreator";
import { useChordPlayer } from "@/hooks/useChordPlayer";

const Index = () => {
  const [query, setQuery] = useState("");
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeVoicing, setActiveVoicing] = useState(0);
  const { playChord } = useChordPlayer();

  const allChords = useMemo(() => getAllChordsWithCustom(), [refreshKey]);

  const filteredChords = useMemo(() => {
    let results = query ? searchChords(query) : allChords;
    if (query) {
      const q = query.toLowerCase().trim();
      const customFiltered = allChords.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q) ||
        `${c.key}${c.suffix}`.toLowerCase().includes(q)
      );
      const ids = new Set(results.map(c => `${c.key}-${c.suffix}`));
      for (const c of customFiltered) {
        if (!ids.has(`${c.key}-${c.suffix}`)) {
          results.push(c);
        }
      }
    } else {
      results = allChords;
    }
    if (activeRoot) {
      results = results.filter(c => c.key === activeRoot);
    }
    if (activeSuffix) {
      results = results.filter(c => c.suffix === activeSuffix);
    }
    return results;
  }, [query, activeRoot, activeSuffix, allChords]);

  const handleRootClick = (root: string) => {
    setActiveRoot(prev => prev === root ? null : root);
    setSelectedChord(null);
    setActiveVoicing(0);
  };

  const handleSuffixClick = (suffix: string) => {
    setActiveSuffix(prev => prev === suffix ? null : suffix);
    setSelectedChord(null);
    setActiveVoicing(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedChord(null);
    setActiveVoicing(0);
  };

  const handleSearchFocus = () => {
    setSelectedChord(null);
    setActiveVoicing(0);
  };

  const handleChordSelect = (chord: Chord) => {
    setSelectedChord(prev => prev && prev.key === chord.key && prev.suffix === chord.suffix ? null : chord);
    setActiveVoicing(0);
  };

  const handleVoicingSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Guitar className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">
              Chord Library
            </h1>
            <button
              onClick={() => setShowCreator(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Custom</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder="Search chords… e.g. Am7, C#m"
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>

        {/* Root note filter */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {rootNotes.map(root => (
              <button
                key={root}
                onClick={() => handleRootClick(root)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeRoot === root
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {root}
              </button>
            ))}
          </div>
        </div>

        {/* Suffix filter */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {suffixes.map(s => (
              <button
                key={s}
                onClick={() => handleSuffixClick(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  activeSuffix === s
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {suffixLabels[s] || s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Chord grid + voicing display */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Chord buttons grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
          {filteredChords.map(chord => {
            const id = `${chord.key}-${chord.suffix}`;
            const isSelected = selectedChord && `${selectedChord.key}-${selectedChord.suffix}` === id;
            return (
              <button
                key={id}
                onClick={() => handleChordSelect(chord)}
                className={`p-2.5 rounded-xl text-center transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-lg scale-105"
                    : "bg-card hover:bg-surface-elevated border border-border/30"
                }`}
              >
                <p className={`text-base font-bold ${isSelected ? "" : "text-foreground"}`}>{chord.label}</p>
                <p className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
                </p>
              </button>
            );
          })}
        </div>

        {filteredChords.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-sm">No chords found</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Try a different search or create your own voicing</p>
            <button
              onClick={() => setShowCreator(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Create Voicing
            </button>
          </motion.div>
        )}

        {/* Selected chord voicings */}
        <AnimatePresence mode="wait">
          {selectedChord && (
            <motion.div
              key={`${selectedChord.key}-${selectedChord.suffix}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl p-4 border border-border/50"
            >
              <h2 className="text-2xl font-bold text-foreground mb-1">{selectedChord.label}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedChord.voicings.length} voicing{selectedChord.voicings.length !== 1 ? "s" : ""} available
              </p>

              {/* Voicing pills */}
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                {selectedChord.voicings.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVoicing(i)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      i === activeVoicing
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>

              {/* Large diagram */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVoicing}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center"
                >
                  <ChordDiagram voicing={selectedChord.voicings[activeVoicing]} size="lg" />
                </motion.div>
              </AnimatePresence>

              {/* Play + positions */}
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => playChord(selectedChord.voicings[activeVoicing])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  <Volume2 className="w-4 h-4" />
                  Play
                </button>
                <p className="text-xs text-muted-foreground font-mono tracking-wide">
                  {selectedChord.voicings[activeVoicing].positions.map(p =>
                    p === -1 ? "x" : p.toString()
                  ).join(" · ")}
                </p>
              </div>

              {/* Voicing grid thumbnails */}
              <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-border/30">
                {selectedChord.voicings.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVoicing(i)}
                    className={`p-2 rounded-xl border transition-colors ${
                      i === activeVoicing
                        ? "border-primary bg-primary/10"
                        : "border-border/30 bg-secondary/30 hover:border-muted-foreground/30"
                    }`}
                  >
                    <ChordDiagram voicing={v} size="sm" />
                    <p className="text-[9px] text-muted-foreground mt-1 text-center truncate">{v.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-20" />
      </main>

      {/* Creator overlay */}
      <AnimatePresence>
        {showCreator && (
          <VoicingCreator
            onClose={() => setShowCreator(false)}
            onSaved={handleVoicingSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
