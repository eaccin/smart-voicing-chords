import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { Volume2 } from "lucide-react";
import type { Chord } from "@/data/chords";
import ChordDiagram from "./ChordDiagram";
import { useChordPlayer } from "@/hooks/useChordPlayer";

interface ChordCardProps {
  chord: Chord;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ChordCard({ chord, isExpanded, onToggle }: ChordCardProps) {
  const { playChord } = useChordPlayer();

  return (
    <motion.div
      layout
      className="bg-card rounded-2xl shadow-card overflow-hidden cursor-pointer"
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
      {/* Collapsed: small preview */}
      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0 w-[100px]">
          <ChordDiagram voicing={chord.voicings[0]} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold tracking-tighter text-foreground">
            {chord.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {chord.voicings.length} voicing{chord.voicings.length > 1 ? "s" : ""}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Expanded: full diagram + variations */}
      <AnimatePresence>
        {isExpanded && (
          <ExpandedContent chord={chord} onPlayChord={playChord} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExpandedContent({ chord, onPlayChord }: { chord: Chord; onPlayChord: (v: any) => void }) {
  const [activeVoicing, setActiveVoicing] = React.useState(0);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-5 pt-1" onClick={(e) => e.stopPropagation()}>
        {/* Variation pills */}
        {chord.voicings.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {chord.voicings.map((v, i) => (
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
        )}

        {/* Large diagram */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeVoicing}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="flex justify-center"
          >
            <ChordDiagram voicing={chord.voicings[activeVoicing]} size="lg" />
          </motion.div>
        </AnimatePresence>

        {/* Play button + Fingering info */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => onPlayChord(chord.voicings[activeVoicing])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Volume2 className="w-4 h-4" />
            Play
          </button>
          <p className="text-xs text-muted-foreground font-mono tracking-wide">
            {chord.voicings[activeVoicing].positions.map(p => 
              p === -1 ? "x" : p.toString()
            ).join(" · ")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
