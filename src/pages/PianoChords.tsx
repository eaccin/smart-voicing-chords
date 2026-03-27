import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Piano, Volume2 } from "lucide-react";
import {
  getAllPianoChords, searchPianoChords,
  pianoRootNotes, pianoSuffixes, pianoSuffixLabels,
} from "@/data/pianoChords";
import type { PianoChord, PianoChordVoicing } from "@/data/pianoChords";
import PianoDiagram from "@/components/PianoDiagram";

const PianoChords = () => {
  const [query, setQuery] = useState("");
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [activeSuffix, setActiveSuffix] = useState<string | null>(null);
  const [expandedChordId, setExpandedChordId] = useState<string | null>(null);

  const allChords = useMemo(() => getAllPianoChords(), []);

  const filteredChords = useMemo(() => {
    let results = query ? searchPianoChords(query) : allChords;
    if (activeRoot) results = results.filter(c => c.key === activeRoot);
    if (activeSuffix) results = results.filter(c => c.suffix === activeSuffix);
    return results;
  }, [query, activeRoot, activeSuffix, allChords]);

  const chordRows = useMemo(() => {
    const cols = window.innerWidth >= 640 ? 5 : 4;
    const rows: PianoChord[][] = [];
    for (let i = 0; i < filteredChords.length; i += cols) {
      rows.push(filteredChords.slice(i, i + cols));
    }
    return rows;
  }, [filteredChords]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Piano className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">
              Piano Chords
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setExpandedChordId(null); }}
              onFocus={() => setExpandedChordId(null)}
              placeholder="Search chords… e.g. Am7, C#m"
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {pianoRootNotes.map(root => (
              <button
                key={root}
                onClick={() => { setActiveRoot(prev => prev === root ? null : root); setExpandedChordId(null); }}
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

        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {pianoSuffixes.map(s => (
              <button
                key={s}
                onClick={() => { setActiveSuffix(prev => prev === s ? null : s); setExpandedChordId(null); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  activeSuffix === s
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {pianoSuffixLabels[s] || s}
              </button>
            ))}
          </div>
        </div>
      </header>

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
                    onClick={() => setExpandedChordId(prev => prev === id ? null : id)}
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
                    <InlinePianoVoicingPanel chord={chord} />
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        ))}

        {filteredChords.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-sm">No chords found</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Try a different search</p>
          </motion.div>
        )}

        <div className="h-20" />
      </main>
    </div>
  );
};

const SHARP_ROOTS = new Set(["C", "C#", "D", "E", "F#", "G", "A", "B"]);

function InlinePianoVoicingPanel({ chord }: { chord: PianoChord }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const useSharps = SHARP_ROOTS.has(chord.key);

  const noteNames = chord.voicings[activeIdx].notes.map(midi => {
    const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const flatNames  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const names = useSharps ? sharpNames : flatNames;
    const octave = Math.floor(midi / 12) - 1;
    return `${names[midi % 12]}${octave}`;
  });

  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-foreground">{chord.label}</span>
        <span className="text-[10px] text-muted-foreground">
          {chord.voicings.length} voicing{chord.voicings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex justify-center mb-3"
        >
          <PianoDiagram voicing={chord.voicings[activeIdx]} size="lg" useSharpNames={useSharps} />
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3 mb-3">
        <p className="text-xs text-muted-foreground font-mono tracking-wide">
          {noteNames.join(" · ")}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {chord.voicings.map((v, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-shrink-0 ${
              i === activeIdx
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "hover:bg-secondary/50"
            }`}
          >
            <div className="w-[80px]">
              <PianoDiagram voicing={v} size="sm" useSharpNames={useSharps} />
            </div>
            <span className="text-[9px] text-muted-foreground mt-1">{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PianoChords;
