import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronLeft, FileText, LayoutGrid } from "lucide-react";
import type { Song, SongSection, SongChord, Meter, MeterType } from "@/data/songs";
import { SECTION_TYPES, PRESET_METERS, createId, saveSong } from "@/data/songs";
import { getAllChordsWithCustom } from "@/data/chords";
import { createEmptyLeadSheet } from "@/data/leadsheet";
import type { LeadSheet } from "@/data/leadsheet";
import ChordDiagram from "./ChordDiagram";
import TapTempo from "./TapTempo";
import ChordPicker from "./ChordPicker";
import ChordSheet from "./ChordSheet";
import MeterSelector from "./MeterSelector";
import LeadSheetEditor from "./leadsheet/LeadSheetEditor";
import LeadSheetPlayer from "./leadsheet/LeadSheetPlayer";

interface SongEditorProps {
  song: Song;
  onBack: () => void;
  onSaved: () => void;
}

const DEFAULT_METER: Meter = { type: "4/4", beatsPerMeasure: 4, beatUnit: 4 };

export default function SongEditor({ song: initialSong, onBack, onSaved }: SongEditorProps) {
  const [song, setSong] = useState<Song>({
    ...initialSong,
    meter: initialSong.meter ?? DEFAULT_METER,
    bpm: initialSong.bpm ?? 120,
    sections: initialSong.sections.map(s => ({ ...s, chords: [...s.chords] })),
  });
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [expandedChord, setExpandedChord] = useState<string | null>(null);
  const [showChordSheet, setShowChordSheet] = useState(false);
  const [showMeterOverride, setShowMeterOverride] = useState<string | null>(null);

  const allChords = getAllChordsWithCustom();

  // Hide bottom nav while editor is active
  useEffect(() => {
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.style.display = "none";
    return () => { if (nav) nav.style.display = ""; };
  }, []);

  function updateSong(updater: (s: Song) => Song) {
    setSong(prev => {
      const next = updater({ ...prev, sections: prev.sections.map(s => ({ ...s, chords: [...s.chords] })) });
      return next;
    });
  }

  function handleSave() {
    saveSong(song);
    onSaved();
    onBack();
  }

  function addSection(type: SongSection["type"]) {
    const count = song.sections.filter(s => s.type === type).length;
    const typeLabel = SECTION_TYPES.find(t => t.value === type)?.label ?? type;
    const label = count > 0 ? `${typeLabel} ${count + 1}` : typeLabel;
    updateSong(s => ({
      ...s,
      sections: [...s.sections, { id: createId(), type, label, chords: [] }],
    }));
  }

  function removeSection(sectionId: string) {
    updateSong(s => ({
      ...s,
      sections: s.sections.filter(sec => sec.id !== sectionId),
    }));
  }

  function addChordToSection(sectionId: string, chord: SongChord) {
    updateSong(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, chords: [...sec.chords, chord] } : sec
      ),
    }));
    setPickerTarget(null);
  }

  function removeChordFromSection(sectionId: string, chordIndex: number) {
    updateSong(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, chords: sec.chords.filter((_, i) => i !== chordIndex) } : sec
      ),
    }));
  }

  function moveSection(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= song.sections.length) return;
    updateSong(s => {
      const secs = [...s.sections];
      const [moved] = secs.splice(fromIdx, 1);
      secs.splice(toIdx, 0, moved);
      return { ...s, sections: secs };
    });
  }

  function getVoicingForChord(chord: SongChord) {
    const found = allChords.find(c => c.key === chord.chordKey && c.suffix === chord.suffix);
    if (!found) return null;
    return found.voicings[chord.voicingIndex] ?? found.voicings[0] ?? null;
  }

  function setSectionMeterOverride(sectionId: string, meter: Meter | undefined) {
    updateSong(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, meterOverride: meter } : sec
      ),
    }));
    setShowMeterOverride(null);
  }

  if (showChordSheet) {
    saveSong(song);
    return <ChordSheet song={song} onBack={() => setShowChordSheet(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={song.title}
                onChange={e => updateSong(s => ({ ...s, title: e.target.value }))}
                placeholder="Song Title"
                className="w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground outline-none"
              />
              <input
                type="text"
                value={song.artist ?? ""}
                onChange={e => updateSong(s => ({ ...s, artist: e.target.value }))}
                placeholder="Artist (optional)"
                className="w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none mt-0.5"
              />
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* Tempo & Meter */}
        <div className="mb-6 p-4 bg-card rounded-2xl border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tempo & Meter</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">BPM</label>
              <input
                type="number"
                min={20}
                max={300}
                value={song.bpm ?? 120}
                onChange={e => updateSong(s => ({ ...s, bpm: parseInt(e.target.value) || 120 }))}
                className="w-20 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-semibold text-center outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <MeterSelector
              meter={song.meter ?? DEFAULT_METER}
              onChange={meter => updateSong(s => ({ ...s, meter }))}
            />
          </div>
          <div className="mt-3">
            <TapTempo
              onBpmDetected={bpm => updateSong(s => ({ ...s, bpm }))}
              currentBpm={song.bpm ?? 120}
              beatsPerMeasure={(song.meter ?? DEFAULT_METER).beatsPerMeasure}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {song.sections.map((section, sectionIdx) => (
            <motion.div
              key={section.id}
              layout
              className="bg-card rounded-2xl overflow-hidden border border-border/50"
            >
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-elevated/50">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSection(sectionIdx, sectionIdx - 1)}
                    disabled={sectionIdx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                  </button>
                  <button
                    onClick={() => moveSection(sectionIdx, sectionIdx + 1)}
                    disabled={sectionIdx === song.sections.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={section.label}
                  onChange={e => updateSong(s => ({
                    ...s,
                    sections: s.sections.map(sec =>
                      sec.id === section.id ? { ...sec, label: e.target.value } : sec
                    ),
                  }))}
                  className="flex-1 bg-transparent text-sm font-bold text-foreground uppercase tracking-wider outline-none"
                />

                {/* Section meter override */}
                <button
                  onClick={() => setShowMeterOverride(prev => prev === section.id ? null : section.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                    section.meterOverride
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {section.meterOverride
                    ? `${section.meterOverride.beatsPerMeasure}/${section.meterOverride.beatUnit}`
                    : `${(song.meter ?? DEFAULT_METER).beatsPerMeasure}/${(song.meter ?? DEFAULT_METER).beatUnit}`
                  }
                </button>

                <button
                  onClick={() => removeSection(section.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Meter override selector */}
              {showMeterOverride === section.id && (
                <div className="px-4 py-2 bg-secondary/30 border-b border-border/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Section meter:</span>
                    <MeterSelector
                      meter={section.meterOverride ?? song.meter ?? DEFAULT_METER}
                      onChange={meter => setSectionMeterOverride(section.id, meter)}
                      compact
                    />
                    {section.meterOverride && (
                      <button
                        onClick={() => setSectionMeterOverride(section.id, undefined)}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        Reset to song default
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Chords in section */}
              <div className="px-4 py-3">
                {section.chords.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {section.chords.map((chord, chordIdx) => {
                      const voicing = getVoicingForChord(chord);
                      const chordId = `${section.id}-${chordIdx}`;
                      const isExpanded = expandedChord === chordId;
                      return (
                        <motion.div key={chordIdx} layout className="relative group">
                          <button
                            onClick={() => setExpandedChord(prev => prev === chordId ? null : chordId)}
                            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                              isExpanded ? "bg-primary/10 ring-1 ring-primary/30" : "bg-secondary/50 hover:bg-secondary"
                            }`}
                          >
                            <span className="text-sm font-bold text-foreground mb-1">{chord.label}</span>
                            {voicing && (
                              <div className="w-[60px]">
                                <ChordDiagram voicing={voicing} size="sm" />
                              </div>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeChordFromSection(section.id, chordIdx); }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">No chords yet</p>
                )}

                <button
                  onClick={() => setPickerTarget(section.id)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Chord
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add section */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add Section</p>
          <div className="flex flex-wrap gap-2">
            {SECTION_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => addSection(t.value)}
                className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 text-xs font-semibold transition-colors"
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chord Sheet button */}
        {song.sections.length > 0 && (
          <button
            onClick={() => setShowChordSheet(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/20 border border-accent/30 text-foreground hover:bg-accent/30 transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">View Chord Sheet</span>
          </button>
        )}
      </main>

      {/* Chord picker overlay */}
      <AnimatePresence>
        {pickerTarget && (
          <ChordPicker
            onPick={(chord) => addChordToSection(pickerTarget, chord)}
            onClose={() => setPickerTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3L9 9M9 3L3 9" />
    </svg>
  );
}
