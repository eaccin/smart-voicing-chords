import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Square, Save, Volume2, X } from "lucide-react";
import type { VoicingPath, ProgressionChord, ScoredVoicing } from "@/engine/voicingEngine";
import { resolveChords, getAvgFret } from "@/engine/voicingEngine";
import type { ChordVoicing } from "@/data/chords";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import ChordDiagram from "@/components/ChordDiagram";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface VoicingPathResultsProps {
  paths: VoicingPath[];
  progression: ProgressionChord[];
  onSave?: (path: VoicingPath) => void;
  onPathChange?: (pathIndex: number, updatedPath: VoicingPath) => void;
}

const REGION_COLORS: Record<string, string> = {
  low: "bg-accent/10 border-accent/30 text-accent",
  mid: "bg-primary/10 border-primary/30 text-primary",
  high: "bg-destructive/10 border-destructive/30 text-destructive",
};

export default function VoicingPathResults({ paths: initialPaths, progression, onSave, onPathChange }: VoicingPathResultsProps) {
  const [paths, setPaths] = useState(initialPaths);
  const [selectedPath, setSelectedPath] = useState(0);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [swapOpen, setSwapOpen] = useState<number | null>(null);
  const { playChord } = useChordPlayer();
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Sync if parent regenerates
  const [prevInitial, setPrevInitial] = useState(initialPaths);
  if (initialPaths !== prevInitial) {
    setPaths(initialPaths);
    setPrevInitial(initialPaths);
    setSelectedPath(0);
  }

  const stopPlayback = useCallback(() => {
    playTimeoutRef.current.forEach(clearTimeout);
    playTimeoutRef.current = [];
    setPlayingIdx(null);
    setIsPlayingAll(false);
  }, []);

  function handlePlaySingle(voicing: ChordVoicing, index: number) {
    playChord(voicing, 1.2);
    setPlayingIdx(index);
    setTimeout(() => setPlayingIdx(null), 1200);
  }

  function handlePlayAll() {
    if (isPlayingAll) {
      stopPlayback();
      return;
    }

    const path = paths[selectedPath];
    if (!path) return;

    setIsPlayingAll(true);
    const interval = 1400;

    path.voicings.forEach((sv, i) => {
      const t = setTimeout(() => {
        playChord(sv.voicing, 1.2);
        setPlayingIdx(i);
        if (i === path.voicings.length - 1) {
          setTimeout(() => {
            setPlayingIdx(null);
            setIsPlayingAll(false);
          }, 1200);
        }
      }, i * interval);
      playTimeoutRef.current.push(t);
    });
  }

  function handleSwapVoicing(chordIdx: number, voicing: ChordVoicing, voicingIndex: number) {
    const updated = [...paths];
    const path = { ...updated[selectedPath] };
    const voicings = [...path.voicings];
    voicings[chordIdx] = {
      voicing,
      voicingIndex,
      avgFret: getAvgFret(voicing),
      score: voicings[chordIdx].score,
    };
    path.voicings = voicings;
    path.totalScore = voicings.reduce((s, v) => s + v.score, 0);
    updated[selectedPath] = path;
    setPaths(updated);
    setSwapOpen(null);
    onPathChange?.(selectedPath, path);
  }

  if (paths.length === 0) return null;

  const activePath = paths[selectedPath] ?? paths[0];
  const resolvedChords = resolveChords(progression);

  return (
    <div className="space-y-4">
      {/* Region tabs */}
      <div className="flex gap-2">
        {paths.map((path, i) => (
          <button
            key={path.region}
            onClick={() => { setSelectedPath(i); stopPlayback(); }}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
              selectedPath === i
                ? REGION_COLORS[path.region]
                : "bg-secondary/30 border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div>{path.region === "low" ? "Low" : path.region === "mid" ? "Mid" : "High"}</div>
            <div className="text-[10px] font-normal opacity-70 mt-0.5">
              Score: {path.totalScore.toFixed(1)}
            </div>
          </button>
        ))}
      </div>

      {/* Voicing strip */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {activePath.label}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePlayAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isPlayingAll
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary/15 text-primary hover:bg-primary/25"
              }`}
            >
              {isPlayingAll ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlayingAll ? "Stop" : "Play All"}
            </button>
            {onSave && (
              <button
                onClick={() => onSave(activePath)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex gap-4 min-w-min">
            {activePath.voicings.map((sv, i) => {
              const chord = resolvedChords[i];
              const altVoicings = chord?.voicings ?? [];

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-xs font-bold text-foreground mb-1">
                    {progression[i]?.label}
                  </span>

                  <Popover open={swapOpen === i} onOpenChange={(open) => setSwapOpen(open ? i : null)}>
                    <PopoverTrigger asChild>
                      <button
                        className={`relative w-[72px] p-1 rounded-xl transition-all ${
                          playingIdx === i
                            ? "bg-primary/20 ring-2 ring-primary/40 scale-105"
                            : swapOpen === i
                            ? "bg-accent/20 ring-2 ring-accent/40"
                            : "bg-secondary/30 hover:bg-secondary/50"
                        }`}
                      >
                        <ChordDiagram voicing={sv.voicing} size="sm" />
                        {playingIdx === i && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Volume2 className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto max-w-[320px] max-h-[300px] overflow-y-auto p-2"
                      side="top"
                      align="center"
                    >
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Pick voicing
                        </p>
                        <button onClick={() => setSwapOpen(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {altVoicings.map((alt, vi) => (
                          <button
                            key={vi}
                            onClick={() => {
                              handlePlaySingle(alt, i);
                              handleSwapVoicing(i, alt, vi);
                            }}
                            className={`flex flex-col items-center p-1.5 rounded-xl transition-colors ${
                              sv.voicingIndex === vi
                                ? "bg-accent/20 ring-1 ring-accent/40"
                                : "bg-secondary/30 hover:bg-secondary/50"
                            }`}
                          >
                            <div className="w-[60px]">
                              <ChordDiagram voicing={alt} size="sm" />
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-0.5">{alt.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <span className="text-[10px] text-muted-foreground mt-1">
                    {sv.voicing.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    avg fret {sv.avgFret.toFixed(0)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
