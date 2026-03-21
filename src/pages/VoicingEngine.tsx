import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProgressionChord, VoicingPath } from "@/engine/voicingEngine";
import { generateVoicingPaths } from "@/engine/voicingEngine";
import type { Song, SongSection, SongChord } from "@/data/songs";
import { getSongs, saveSong, createId } from "@/data/songs";
import ProgressionInput from "@/components/engine/ProgressionInput";
import VoicingPathResults from "@/components/engine/VoicingPathResults";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function VoicingEngine() {
  const navigate = useNavigate();
  const [progression, setProgression] = useState<ProgressionChord[]>([]);
  const [paths, setPaths] = useState<VoicingPath[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadOpen, setLoadOpen] = useState(false);

  function handleGenerate() {
    if (progression.length < 2) return;
    const result = generateVoicingPaths(progression);
    setPaths(result);
    setHasGenerated(true);
  }

  function handleLoadSong(song: Song) {
    // Collect all chords from all sections
    const chords: ProgressionChord[] = [];
    for (const section of song.sections) {
      for (const sc of section.chords) {
        chords.push({ key: sc.chordKey, suffix: sc.suffix, label: sc.label });
      }
    }
    if (chords.length > 0) {
      setProgression(chords);
      setPaths([]);
      setHasGenerated(false);
    }
    setLoadOpen(false);
  }

  const handleSave = useCallback((path: VoicingPath) => {
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

  const savedSongs = getSongs();

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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Chord Progression
            </p>
            {savedSongs.length > 0 && (
              <Popover open={loadOpen} onOpenChange={setLoadOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Load Saved
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 max-h-[300px] overflow-y-auto p-2" side="bottom" align="end">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Saved Songs
                  </p>
                  <div className="space-y-1">
                    {savedSongs.map(song => (
                      <button
                        key={song.id}
                        onClick={() => handleLoadSong(song)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {song.sections.reduce((n, s) => n + s.chords.length, 0)} chords · {song.sections.length} section{song.sections.length !== 1 ? "s" : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
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
