import { ChevronLeft, Printer, Volume2, VolumeX, Play, Square, Repeat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song, SongChord, Meter } from "@/data/songs";
import { getAllChordsWithCustom } from "@/data/chords";
import ChordDiagram from "./ChordDiagram";
import { useMetronome } from "@/hooks/useMetronome";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import { useState, useRef, useCallback, useEffect } from "react";

interface ChordSheetProps {
  song: Song;
  onBack: () => void;
}

const DEFAULT_METER: Meter = { type: "4/4", beatsPerMeasure: 4, beatUnit: 4 };

export default function ChordSheet({ song, onBack }: ChordSheetProps) {
  const allChords = getAllChordsWithCustom();
  const metronome = useMetronome();
  const { playChord } = useChordPlayer();
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [activeChordIndex, setActiveChordIndex] = useState(-1);
  const autoPlayTimerRef = useRef<number | null>(null);
  const autoPlayIndexRef = useRef(0);

  const songMeter = song.meter ?? DEFAULT_METER;
  const songBpm = song.bpm ?? 120;

  function getVoicing(chord: SongChord) {
    const found = allChords.find(c => c.key === chord.chordKey && c.suffix === chord.suffix);
    if (!found) return null;
    return found.voicings[chord.voicingIndex] ?? found.voicings[0] ?? null;
  }

  const usedChordKeys = new Set<string>();
  const uniqueChords: SongChord[] = [];
  song.sections.forEach(sec =>
    sec.chords.forEach(ch => {
      const k = `${ch.chordKey}-${ch.suffix}-${ch.voicingIndex}`;
      if (!usedChordKeys.has(k)) {
        usedChordKeys.add(k);
        uniqueChords.push(ch);
      }
    })
  );

  // Build flat list of all chords with their effective meter
  type ChordWithMeter = { chord: SongChord; meter: Meter };
  const allSongChords: ChordWithMeter[] = [];
  song.sections.forEach(sec => {
    const m = sec.meterOverride ?? songMeter;
    sec.chords.forEach(ch => allSongChords.push({ chord: ch, meter: m }));
  });

  const [currentAutoMeter, setCurrentAutoMeter] = useState<Meter>(songMeter);

  function toggleMetronome() {
    if (metronomeOn) {
      metronome.stop();
      setMetronomeOn(false);
    } else {
      metronome.start(songBpm, songMeter.beatsPerMeasure);
      setMetronomeOn(true);
    }
  }

  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current !== null) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    setAutoPlaying(false);
    setActiveChordIndex(-1);
    autoPlayIndexRef.current = 0;
    setCurrentAutoMeter(songMeter);
  }, [songMeter]);

  const loopEnabledRef = useRef(false);
  loopEnabledRef.current = loopEnabled;

  const scheduleNext = useCallback((index: number, chords: ChordWithMeter[]) => {
    if (index >= chords.length) {
      if (loopEnabledRef.current) {
        // Loop back to start
        autoPlayIndexRef.current = 0;
        scheduleNext(0, chords);
        return;
      }
      stopAutoPlay();
      metronome.stop();
      setMetronomeOn(false);
      return;
    }

    const { chord, meter } = chords[index];
    const voicing = getVoicing(chord);
    if (voicing) playChord(voicing);
    setActiveChordIndex(index);
    setCurrentAutoMeter(meter);

    // Restart metronome if meter changed
    const prevMeter = index > 0 ? chords[index - 1].meter : null;
    if (!prevMeter || prevMeter.beatsPerMeasure !== meter.beatsPerMeasure || prevMeter.beatUnit !== meter.beatUnit) {
      metronome.stop();
      metronome.start(songBpm, meter.beatsPerMeasure);
    }

    const measureDuration = (60 / songBpm) * meter.beatsPerMeasure * 1000;
    autoPlayTimerRef.current = window.setTimeout(() => {
      autoPlayIndexRef.current = index + 1;
      scheduleNext(index + 1, chords);
    }, measureDuration);
  }, [songBpm, metronome, playChord, stopAutoPlay]);

  const startAutoPlay = useCallback(() => {
    if (allSongChords.length === 0) return;
    stopAutoPlay();
    setMetronomeOn(true);
    setAutoPlaying(true);
    autoPlayIndexRef.current = 0;
    scheduleNext(0, allSongChords);
  }, [allSongChords, stopAutoPlay, scheduleNext]);

  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current !== null) clearTimeout(autoPlayTimerRef.current);
    };
  }, []);

  function handlePrint() {
    window.print();
  }

  function getMeterDisplay(meter: Meter) {
    return `${meter.beatsPerMeasure}/${meter.beatUnit}`;
  }

  // Calculate flat index for highlighting
  let flatIndex = 0;
  function getFlatIndex() {
    return flatIndex++;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50 print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{song.title || "Untitled Song"}</h1>
              {song.artist && <p className="text-xs text-muted-foreground">{song.artist}</p>}
            </div>

            {/* Loop toggle */}
            <button
              onClick={() => setLoopEnabled(p => !p)}
              className={`p-2 rounded-xl transition-colors ${
                loopEnabled
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={loopEnabled ? "Loop on" : "Loop off"}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Auto-play toggle */}
            <button
              onClick={autoPlaying ? stopAutoPlay : startAutoPlay}
              className={`p-2 rounded-xl transition-colors ${
                autoPlaying
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={autoPlaying ? "Stop auto-play" : "Auto-play chords"}
            >
              {autoPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Metronome toggle */}
            <button
              onClick={toggleMetronome}
              className={`p-2 rounded-xl transition-colors ${
                metronomeOn
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              title={metronomeOn ? "Stop metronome" : "Start metronome"}
            >
              {metronomeOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Print/PDF */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Print / Save as PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>

          {/* Metronome info bar */}
          {metronomeOn && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">{songBpm} BPM</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs font-semibold text-muted-foreground">{getMeterDisplay(autoPlaying ? currentAutoMeter : songMeter)}</span>
              <div className="flex gap-1 ml-2">
                {Array.from({ length: (autoPlaying ? currentAutoMeter : songMeter).beatsPerMeasure }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      metronome.currentBeat === i
                        ? i === 0
                          ? "bg-primary scale-125"
                          : "bg-accent-foreground"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Song info for print */}
        <div className="hidden print:block mb-4">
          <p className="text-sm text-muted-foreground">
            {songBpm} BPM · {getMeterDisplay(songMeter)}
          </p>
        </div>

        {/* Chord reference at top — tap to hear */}
        {uniqueChords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Chord Reference · tap to hear</h2>
            <div className="flex flex-wrap gap-4">
              {uniqueChords.map((ch, i) => {
                const voicing = getVoicing(ch);
                return (
                  <button
                    key={i}
                    className="flex flex-col items-center group"
                    onClick={() => voicing && playChord(voicing)}
                  >
                    <span className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{ch.label}</span>
                    {voicing && (
                      <div className="w-[70px] group-hover:scale-105 transition-transform">
                        <ChordDiagram voicing={voicing} size="sm" />
                      </div>
                    )}
                    <Volume2 className="w-3 h-3 text-muted-foreground/50 mt-1 group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sections */}
        {song.sections.map(section => {
          const sectionMeter = section.meterOverride ?? songMeter;
          const hasMeterChange = !!section.meterOverride;
          return (
            <div key={section.id} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-lg">
                  {section.label}
                </span>
                {hasMeterChange && (
                  <span className="text-[10px] font-bold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded-md">
                    {getMeterDisplay(sectionMeter)}
                  </span>
                )}
              </div>
              {section.chords.length > 0 ? (
                <ChordSheetChordGrid
                  chords={section.chords}
                  getVoicing={getVoicing}
                  getFlatIndex={getFlatIndex}
                  autoPlaying={autoPlaying}
                  activeChordIndex={activeChordIndex}
                  playChord={playChord}
                />
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">No chords</p>
              )}
              {section.lyrics && (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans print:text-xs">
                  {section.lyrics}
                </p>
              )}
            </div>
          );
        })}

        {song.sections.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No sections in this song yet.</p>
        )}
      </main>
    </div>
  );
}

/** Chord grid with expandable voicing diagrams */
function ChordSheetChordGrid({
  chords,
  getVoicing,
  getFlatIndex,
  autoPlaying,
  activeChordIndex,
  playChord,
}: {
  chords: SongChord[];
  getVoicing: (ch: SongChord) => any;
  getFlatIndex: () => number;
  autoPlaying: boolean;
  activeChordIndex: number;
  playChord: (v: any) => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const allChords = getAllChordsWithCustom();

  function getAllVoicings(ch: SongChord) {
    const found = allChords.find(c => c.key === ch.chordKey && c.suffix === ch.suffix);
    return found?.voicings ?? [];
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-1 gap-y-1 items-baseline font-mono">
        {chords.map((ch, i) => {
          const idx = getFlatIndex();
          const voicing = getVoicing(ch);
          const isActive = autoPlaying && activeChordIndex === idx;
          return (
            <button
              key={i}
              onClick={() => setExpandedIdx(prev => prev === i ? null : i)}
              className={`text-base font-bold px-2 py-1 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                  : expandedIdx === i
                    ? "text-primary bg-primary/10 ring-1 ring-primary/30"
                    : "text-foreground bg-secondary/40 hover:bg-secondary/70"
              }`}
            >
              {ch.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {expandedIdx !== null && expandedIdx < chords.length && (() => {
          const ch = chords[expandedIdx];
          const voicing = getVoicing(ch);
          const allVoicings = getAllVoicings(ch);
          if (!voicing) return null;
          return (
            <motion.div
              key={expandedIdx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3"
            >
              <div className="bg-secondary/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-foreground">{ch.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {allVoicings.length} voicing{allVoicings.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {allVoicings.map((v, vi) => (
                    <button
                      key={vi}
                      onClick={() => playChord(v)}
                      className={`flex flex-col items-center p-2 rounded-xl transition-colors flex-shrink-0 ${
                        vi === ch.voicingIndex
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className="w-[60px]">
                        <ChordDiagram voicing={v} size="sm" />
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-1 truncate max-w-[60px]">{v.name}</span>
                      <Volume2 className="w-3 h-3 text-muted-foreground/50 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
