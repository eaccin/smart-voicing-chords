import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProgressionChord, VoicingPath } from "@/engine/voicingEngine";
import { generateVoicingPaths } from "@/engine/voicingEngine";
import type { Song, SongSection, SongChord } from "@/data/songs";
import { getSongs, saveSong, createId } from "@/data/songs";
import ProgressionInput from "@/components/engine/ProgressionInput";
import VoicingPathResults from "@/components/engine/VoicingPathResults";

export default function VoicingEngine() {
  const navigate = useNavigate();
  const [progression, setProgression] = useState<ProgressionChord[]>([]);
  const [paths, setPaths] = useState<VoicingPath[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleGenerate() {
    if (progression.length < 2) return;
    const result = generateVoicingPaths(progression);
    setPaths(result);
    setHasGenerated(true);
  }

  const handleSave = useCallback((path: VoicingPath) => {
    // Convert path voicings to SongChords
    const songChords: SongChord[] = path.voicings.map((sv, i) => ({
      label: progression[i].label,
      chordKey: progression[i].key,
      suffix: progression[i].suffix,
      voicingIndex: sv.voicingIndex,
    }));

    const section: SongSection = {
      id: createId(),
      type: "verse",
      label: `Progression (${path.region})`,
      chords: songChords,
    };

    // Create a new song with this section
    const song: Song = {
      id: createId(),
      title: progression.map(p => p.label).join(" → "),
      sections: [section],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveSong(song);
    setSaveMessage(`Saved as "${song.title}"`);
    setTimeout(() => setSaveMessage(null), 3000);
  }, [progression]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-accent" />
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">
              Smart Voicing Engine
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-6">
        {/* Intro */}
        <div className="p-4 bg-card rounded-2xl border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Chord Progression
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Add 2+ chords and the engine will find the best connected voicings with minimal fret movement.
          </p>
          <ProgressionInput progression={progression} onChange={setProgression} />
        </div>

        {/* Generate button */}
        {progression.length >= 2 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Generate Voicing Paths
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}

        {/* Results */}
        {hasGenerated && paths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <VoicingPathResults
              paths={paths}
              progression={progression}
              onSave={handleSave}
            />
          </motion.div>
        )}

        {hasGenerated && paths.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No voicing paths found. Some chords may not be in the database.
            </p>
          </div>
        )}

        {/* Save confirmation */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-accent/10 border border-accent/30 rounded-xl text-sm text-accent text-center font-medium"
          >
            ✓ {saveMessage}
          </motion.div>
        )}
      </main>
    </div>
  );
}
