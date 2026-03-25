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
  const [expandedChordId, setExpandedChordId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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

  // Group chords into rows for inline expansion
  const chordRows = useMemo(() => {
    const cols = window.innerWidth >= 640 ? 5 : 4;
    const rows: Chord[][] = [];
    for (let i = 0; i < filteredChords.length; i += cols) {
      rows.push(filteredChords.slice(i, i + cols));
    }
    return rows;
  }, [filteredChords]);

  const handleRootClick = (root: string) => {
    setActiveRoot(prev => prev === root ? null : root);
    setExpandedChordId(null);
  };

  const handleSuffixClick = (suffix: string) => {
    setActiveSuffix(prev => prev === suffix ? null : suffix);
    setExpandedChordId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setExpandedChordId(null);
  };

  const handleChordSelect = (chord: Chord) => {
    const id = `${chord.key}-${chord.suffix}`;
    setExpandedChordId(prev => prev === id ? null : id);
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
              onFocus={() => setExpandedChordId(null)}
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

      {/* Chord grid with inline voicing expansion */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {chordRows.map((row, rowIdx) => (
          <div key={rowIdx}>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2">
              {row.map(chord => {
                const id = `${chord.key}-${chord.suffix}`;
                const isExpanded = expandedChordId === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleChordSelect(chord)}
                    className={`p-2.5 rounded-xl text-center transition-all ${
                      isExpanded
                        ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-lg scale-105"
                        : "bg-card hover:bg-surface-elevated border border-border/30"
                    }`}
                  >
                    <p className={`text-base font-bold ${isExpanded ? "" : "text-foreground"}`}>{chord.label}</p>
                    <p className={`text-[10px] mt-0.5 ${isExpanded ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Inline expansion for this row */}
            <AnimatePresence mode="wait">
              {row.some(c => `${c.key}-${c.suffix}` === expandedChordId) && (() => {
                const chord = row.find(c => `${c.key}-${c.suffix}` === expandedChordId)!;
                return (
                  <motion.div
                    key={expandedChordId}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-2"
                  >
                    <InlineVoicingPanel chord={chord} playChord={playChord} />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        ))}

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

/** Inline voicing expansion panel showing all voicings with diagrams */
function InlineVoicingPanel({ chord, playChord }: { chord: Chord; playChord: (v: any) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-foreground">{chord.label}</span>
        <span className="text-[10px] text-muted-foreground">
          {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Large active diagram */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex justify-center mb-3"
        >
          <ChordDiagram voicing={chord.voicings[activeIdx]} size="lg" />
        </motion.div>
      </AnimatePresence>

      {/* Play button + positions */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => playChord(chord.voicings[activeIdx])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <Volume2 className="w-4 h-4" />
          Play
        </button>
        <p className="text-xs text-muted-foreground font-mono tracking-wide">
          {chord.voicings[activeIdx].positions.map(p =>
            p === -1 ? "x" : p.toString()
          ).join(" · ")}
        </p>
      </div>

      {/* Voicing thumbnails */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {chord.voicings.map((v, i) => (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); playChord(v); }}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-shrink-0 ${
              i === activeIdx
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "hover:bg-secondary/50"
            }`}
          >
            <div className="w-[60px]">
              <ChordDiagram voicing={v} size="sm" />
            </div>
            <span className="text-[9px] text-muted-foreground mt-1 truncate max-w-[60px]">{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Index;
