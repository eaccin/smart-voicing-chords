import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Square, Volume2, VolumeX, ChevronLeft } from "lucide-react";
import type { Song, Meter } from "@/data/songs";
import type { LeadSheet, LeadSheetChord, LeadSheetMeasure } from "@/data/leadsheet";
import { flattenMeasures, getEffectiveChords } from "@/data/leadsheet";
import { getAllChordsWithCustom } from "@/data/chords";
import { useMetronome } from "@/hooks/useMetronome";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import ChordDiagram from "@/components/ChordDiagram";

interface LeadSheetPlayerProps {
  song: Song;
  onBack: () => void;
}

const DEFAULT_METER: Meter = { type: "4/4", beatsPerMeasure: 4, beatUnit: 4 };

export default function LeadSheetPlayer({ song, onBack }: LeadSheetPlayerProps) {
  const allChords = getAllChordsWithCustom();
  const metronome = useMetronome();
  const { playChord } = useChordPlayer();
  const [playing, setPlaying] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [countInBars, setCountInBars] = useState(0);
  const [activeMeasure, setActiveMeasure] = useState(-1);
  const [activeBeat, setActiveBeat] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef({ measureIdx: 0, beat: 0, countInBeatsLeft: 0 });

  const sheet = song.leadSheet;
  if (!sheet) return null;

  const songMeter = song.meter ?? DEFAULT_METER;
  const bpm = song.bpm ?? 120;
  const beatsPerMeasure = songMeter.beatsPerMeasure;

  const flat = flattenMeasures(sheet);
  const allMeasuresList = flat.map(f => f.measure);

  function getVoicing(chord: LeadSheetChord) {
    const found = allChords.find(c => c.key === chord.chordKey && c.suffix === chord.suffix);
    if (!found) return null;
    return found.voicings[chord.voicingIndex] ?? found.voicings[0] ?? null;
  }

  // Collect unique chords for reference
  const usedKeys = new Set<string>();
  const uniqueChords: LeadSheetChord[] = [];
  for (const { measure } of flat) {
    for (const ch of measure.chords) {
      const k = `${ch.chordKey}-${ch.suffix}-${ch.voicingIndex}`;
      if (!usedKeys.has(k)) { usedKeys.add(k); uniqueChords.push(ch); }
    }
  }

  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    metronome.stop();
    setPlaying(false);
    setCountingIn(false);
    setActiveMeasure(-1);
    setActiveBeat(-1);
    stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: 0 };
  }, [metronome]);

  const startPlayback = useCallback(() => {
    if (flat.length === 0) return;
    stopPlayback();
    setPlaying(true);
    metronome.start(bpm, beatsPerMeasure);

    const totalCountInBeats = countInBars * beatsPerMeasure;

    if (totalCountInBeats > 0) {
      setCountingIn(true);
      stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: totalCountInBeats };
      setActiveMeasure(-1);
      setActiveBeat(-1);
    } else {
      stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: 0 };
      setActiveMeasure(0);
      setActiveBeat(0);
      const firstChords = getEffectiveChords(allMeasuresList[0], allMeasuresList, 0);
      const onBeat0 = firstChords.find(c => c.beat === 0);
      if (onBeat0) { const v = getVoicing(onBeat0); if (v) playChord(v); }
    }

    const interval = (60 / bpm) * 1000;
    timerRef.current = window.setInterval(() => {
      let { measureIdx, beat, countInBeatsLeft } = stateRef.current;

      if (countInBeatsLeft > 1) {
        stateRef.current = { measureIdx, beat, countInBeatsLeft: countInBeatsLeft - 1 };
        return;
      }
      if (countInBeatsLeft === 1) {
        stateRef.current = { measureIdx: 0, beat: 0, countInBeatsLeft: 0 };
        setCountingIn(false);
        setActiveMeasure(0);
        setActiveBeat(0);
        const firstChords = getEffectiveChords(allMeasuresList[0], allMeasuresList, 0);
        const onBeat0 = firstChords.find(c => c.beat === 0);
        if (onBeat0) { const v = getVoicing(onBeat0); if (v) playChord(v); }
        return;
      }

      beat++;
      if (beat >= beatsPerMeasure) {
        beat = 0;
        measureIdx++;
        if (measureIdx >= flat.length) { stopPlayback(); return; }
      }
      stateRef.current = { measureIdx, beat, countInBeatsLeft: 0 };
      setActiveMeasure(measureIdx);
      setActiveBeat(beat);

      const chords = getEffectiveChords(allMeasuresList[measureIdx], allMeasuresList, measureIdx);
      const onBeat = chords.find(c => c.beat === beat);
      if (onBeat) { const v = getVoicing(onBeat); if (v) playChord(v); }
    }, interval);
  }, [flat, bpm, beatsPerMeasure, countInBars, metronome, playChord, stopPlayback, allMeasuresList]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Compute global measure index for each row
  let globalIdx = 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{song.title || "Untitled"}</h1>
              {song.artist && <p className="text-xs text-muted-foreground">{song.artist}</p>}
            </div>
            <button
              onClick={playing ? stopPlayback : startPlayback}
              className={`p-2 rounded-xl transition-colors ${
                playing ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {playing ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
          {playing && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">{bpm} BPM</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs font-semibold text-muted-foreground">{beatsPerMeasure}/{songMeter.beatUnit}</span>
              <div className="flex gap-1 ml-2">
                {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      metronome.currentBeat === i
                        ? i === 0 ? "bg-primary scale-125" : "bg-accent-foreground"
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
        {/* Chord reference */}
        {uniqueChords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Chord Reference · tap to hear</h2>
            <div className="flex flex-wrap gap-4">
              {uniqueChords.map((ch, i) => {
                const voicing = getVoicing(ch);
                return (
                  <button key={i} className="flex flex-col items-center group" onClick={() => voicing && playChord(voicing)}>
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

        {/* Lead sheet chart */}
        {sheet.rows.map((row) => {
          const startIdx = globalIdx;
          const rowContent = (
            <div key={row.id} className="mb-4">
              {row.label && (
                <div className="mb-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-lg">
                    {row.label}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {row.measures.map((measure, mIdx) => {
                  const gIdx = startIdx + mIdx;
                  const isActive = playing && activeMeasure === gIdx;
                  const chords = getEffectiveChords(measure, allMeasuresList, gIdx);
                  const chordMap = new Map(chords.map(c => [c.beat, c]));

                  return (
                    <div
                      key={measure.id}
                      className={`h-16 min-w-[80px] flex-1 max-w-[120px] rounded-lg border transition-colors ${
                        isActive ? "border-primary bg-primary/5" : "border-border/50 bg-card"
                      }`}
                    >
                      {measure.isRepeat ? (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">%</span>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 flex items-center px-1.5 gap-0.5">
                            {Array.from({ length: beatsPerMeasure }).map((_, beat) => {
                              const chord = chordMap.get(beat);
                              const isBeatActive = isActive && activeBeat === beat;
                              return (
                                <button
                                  key={beat}
                                  onClick={() => {
                                    if (chord) {
                                      const v = getVoicing(chord);
                                      if (v) playChord(v);
                                    }
                                  }}
                                  className={`flex-1 h-full flex items-center justify-center text-[11px] font-bold rounded transition-colors ${
                                    chord
                                      ? isBeatActive
                                        ? "text-primary-foreground bg-primary"
                                        : "text-foreground hover:text-primary"
                                      : isBeatActive
                                        ? "text-primary"
                                        : "text-muted-foreground/30"
                                  }`}
                                >
                                  {chord ? chord.label : "·"}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center px-1.5 pb-1 gap-0.5">
                            {Array.from({ length: beatsPerMeasure }).map((_, beat) => {
                              const isBeatActive = isActive && activeBeat === beat;
                              return (
                                <div
                                  key={beat}
                                  className={`flex-1 text-center text-xs font-mono transition-colors ${
                                    isBeatActive ? "text-primary font-bold" : "text-muted-foreground/40"
                                  }`}
                                >
                                  /
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
          globalIdx += row.measures.length;
          return rowContent;
        })}

        {flat.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No measures in this lead sheet yet.</p>
        )}
      </main>
    </div>
  );
}
