import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, ChevronDown, Repeat, RefreshCw, Plus, X, Music2, Save, Trash2 } from "lucide-react";
import { PROGRESSIONS, CATEGORIES, resolveProgression } from "@/lib/progressions";
import type { Progression } from "@/lib/progressions";
import { getAllChordsWithCustom, rootNotes } from "@/data/chords";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import { withSharedAudioContext } from "@/hooks/useAudioContext";
import TapTempo from "@/components/TapTempo";

const PLAYABLE_ROOTS = rootNotes.filter(r => !r.includes("b") || ["Bb","Eb","Ab","Db","Gb"].includes(r));

// ── Shared helpers ──────────────────────────────────────────────────────────

function getVoicingForChord(allChords: ReturnType<typeof getAllChordsWithCustom>, key: string, suffix: string) {
  return allChords.find(c => c.key === key && c.suffix === suffix)?.voicings[0] ?? null;
}

function playMetronomeClick(accent: boolean) {
  withSharedAudioContext(accent ? "metro-accent" : "metro-beat", (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = accent ? 1100 : 750;
    osc.type = "sine";
    gain.gain.setValueAtTime(accent ? 0.5 : 0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface LooperChord { key: string; suffix: string; label: string; }

export default function Progressions() {
  const [view, setView] = useState<"library" | "looper">("library");
  const [activeKey, setActiveKey] = useState("C");
  const [activeCategory, setActiveCategory] = useState<string>("Pop");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [looperQueue, setLooperQueue] = useState<LooperChord[]>([]);

  const { playChord } = useChordPlayer();
  const allChords = useMemo(() => getAllChordsWithCustom(), []);
  const timerRef = useRef<number | null>(null);

  const filtered = useMemo(
    () => PROGRESSIONS.filter(p => p.category === activeCategory),
    [activeCategory],
  );

  const stopLibraryPlay = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setPlayingId(null);
    setPlayingIndex(-1);
  }, []);

  const playProgression = useCallback((prog: Progression) => {
    stopLibraryPlay();
    const resolved = resolveProgression(prog, activeKey);
    setPlayingId(prog.id);
    let i = 0;
    function next() {
      if (i >= resolved.length) { stopLibraryPlay(); return; }
      setPlayingIndex(i);
      const v = getVoicingForChord(allChords, resolved[i].key, resolved[i].suffix);
      if (v) playChord(v, 0.8);
      i++;
      timerRef.current = window.setTimeout(next, 900);
    }
    next();
  }, [activeKey, allChords, playChord, stopLibraryPlay]);

  function sendToLooper(prog: Progression) {
    const resolved = resolveProgression(prog, activeKey);
    setLooperQueue(resolved.map(ch => ({
      key: ch.key,
      suffix: ch.suffix,
      label: ch.label,
    })));
    setView("looper");
    stopLibraryPlay();
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">Progressions</h1>
            {/* View toggle */}
            <div className="ml-auto flex rounded-xl bg-secondary/50 p-0.5 gap-0.5">
              <button
                onClick={() => setView("library")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  view === "library" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setView("looper")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  view === "looper" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Repeat className="w-3 h-3" />
                Looper
              </button>
            </div>
          </div>

          {view === "library" && (
            <>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2">
                {PLAYABLE_ROOTS.map(r => (
                  <button
                    key={r}
                    onClick={() => { setActiveKey(r); stopLibraryPlay(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeKey === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setExpandedId(null); stopLibraryPlay(); }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      activeCategory === cat ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {view === "library" ? (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col gap-3">
                {filtered.map(prog => {
                  const resolved = resolveProgression(prog, activeKey);
                  const isExpanded = expandedId === prog.id;
                  const isPlaying = playingId === prog.id;

                  return (
                    <div key={prog.id} className={`rounded-xl border transition-all ${isExpanded ? "border-primary/30 bg-card" : "border-border/30 bg-card"}`}>
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={() => isPlaying ? stopLibraryPlay() : playProgression(prog)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isPlaying ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                          {resolved.map((ch, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all ${
                                isPlaying && playingIndex === i
                                  ? "bg-primary text-primary-foreground scale-110 shadow-md"
                                  : "bg-secondary/60 text-foreground"
                              }`}
                            >
                              {ch.label}
                            </span>
                          ))}
                        </div>

                        {/* Send to looper */}
                        <button
                          onClick={() => sendToLooper(prog)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                          title="Send to Looper"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setExpandedId(prev => prev === prog.id ? null : prog.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="px-4 pb-4 pt-1 border-t border-border/20">
                              <p className="text-xs font-semibold text-foreground mb-1">{prog.name}</p>
                              <p className="text-xs text-muted-foreground mb-3">{prog.description}</p>
                              <div className="flex gap-2 flex-wrap">
                                {resolved.map((ch, i) => (
                                  <div key={i} className="flex flex-col items-center bg-secondary/40 rounded-lg px-3 py-2 min-w-[48px]">
                                    <span className="text-[10px] text-muted-foreground font-mono">{prog.chords[i].semitones === 0 ? "I" : ""}</span>
                                    <span className="text-sm font-bold text-foreground">{ch.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="looper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LooperView
                initialQueue={looperQueue}
                activeKey={activeKey}
                allChords={allChords}
                playChord={playChord}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Saved progressions (localStorage) ────────────────────────────────────────

interface SavedProgression {
  id: string;
  name: string;
  chords: LooperChord[];
  bpm: number;
  beatsPerChord: number;
  savedAt: number;
}

const SAVED_KEY = "chordstrut:saved-progressions";

function loadSavedProgressions(): SavedProgression[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedProgressions(list: SavedProgression[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
}

// ── Looper ────────────────────────────────────────────────────────────────────

const LOOPER_SUFFIXES = [
  { suffix: "major", label: "maj" },
  { suffix: "minor", label: "min" },
  { suffix: "7",     label: "7"   },
  { suffix: "m7",    label: "m7"  },
  { suffix: "maj7",  label: "M7"  },
  { suffix: "sus4",  label: "sus4"},
  { suffix: "sus2",  label: "sus2"},
  { suffix: "dim",   label: "dim" },
  { suffix: "aug",   label: "aug" },
  { suffix: "9",     label: "9"   },
];

const QUICK_PRESETS: { label: string; chords: { st: number; sx: string }[] }[] = [
  { label: "I – IV – V",      chords: [{st:0,sx:"major"},{st:5,sx:"major"},{st:7,sx:"major"}] },
  { label: "I – V – vi – IV", chords: [{st:0,sx:"major"},{st:7,sx:"major"},{st:9,sx:"minor"},{st:5,sx:"major"}] },
  { label: "ii – V – I",      chords: [{st:2,sx:"minor"},{st:7,sx:"7"},{st:0,sx:"major"}] },
  { label: "i – VII – VI",    chords: [{st:0,sx:"minor"},{st:10,sx:"major"},{st:8,sx:"major"}] },
  { label: "I – vi – IV – V", chords: [{st:0,sx:"major"},{st:9,sx:"minor"},{st:5,sx:"major"},{st:7,sx:"major"}] },
  { label: "I – IV – I – V",  chords: [{st:0,sx:"major"},{st:5,sx:"major"},{st:0,sx:"major"},{st:7,sx:"major"}] },
];

const NOTE_NAMES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

function semitoneToKey(root: string, st: number): string {
  const rootIdx = NOTE_NAMES.indexOf(root);
  if (rootIdx === -1) return NOTE_NAMES[st % 12];
  return NOTE_NAMES[(rootIdx + st) % 12];
}

function LooperView({
  initialQueue,
  activeKey,
  allChords,
  playChord,
}: {
  initialQueue: LooperChord[];
  activeKey: string;
  allChords: ReturnType<typeof getAllChordsWithCustom>;
  playChord: (v: any, duration?: number) => void;
}) {
  const [queue, setQueue] = useState<LooperChord[]>(initialQueue);
  const [bpm, setBpm] = useState(90);
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeBeat, setActiveBeat] = useState(0);
  const [loopCount, setLoopCount] = useState(0);

  // Builder state
  const [builderRoot, setBuilderRoot] = useState("C");
  const [builderSuffix, setBuilderSuffix] = useState("major");

  // Saved progressions
  const [saved, setSaved] = useState<SavedProgression[]>(() => loadSavedProgressions());
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Sync queue when initialQueue changes (sent from library)
  const prevInitial = useRef<LooperChord[]>([]);
  useEffect(() => {
    if (initialQueue !== prevInitial.current && initialQueue.length > 0) {
      setQueue(initialQueue);
      prevInitial.current = initialQueue;
    }
  }, [initialQueue]);

  const timerRef   = useRef<number | null>(null);
  const stateRef   = useRef({ chordIdx: 0, beat: 0, loops: 0 });
  const queueRef   = useRef(queue);
  queueRef.current = queue;

  const stopLooper = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPlaying(false);
    setActiveIdx(0);
    setActiveBeat(0);
    setLoopCount(0);
    stateRef.current = { chordIdx: 0, beat: 0, loops: 0 };
  }, []);

  const startLooper = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;
    stopLooper();
    setPlaying(true);
    stateRef.current = { chordIdx: 0, beat: 0, loops: 0 };
    setActiveIdx(0);
    setActiveBeat(0);
    setLoopCount(0);

    // Play first chord immediately
    const firstVoicing = getVoicingForChord(allChords, q[0].key, q[0].suffix);
    if (firstVoicing) playChord(firstVoicing, 1.5);
    playMetronomeClick(true);

    const interval = (60 / bpm) * 1000;
    timerRef.current = window.setInterval(() => {
      const { chordIdx, beat, loops } = stateRef.current;
      const q = queueRef.current;

      // Advance beat
      const nextBeat = beat + 1;

      if (nextBeat >= beatsPerChord) {
        // Advance chord
        const nextChord = chordIdx + 1;
        if (nextChord >= q.length) {
          // End of queue
          const nextLoop = loops + 1;
          if (!loop) { stopLooper(); return; }
          // Loop back
          stateRef.current = { chordIdx: 0, beat: 0, loops: nextLoop };
          setActiveIdx(0);
          setActiveBeat(0);
          setLoopCount(nextLoop);
          const v = getVoicingForChord(allChords, q[0].key, q[0].suffix);
          if (v) playChord(v, 1.5);
          playMetronomeClick(true);
        } else {
          stateRef.current = { chordIdx: nextChord, beat: 0, loops };
          setActiveIdx(nextChord);
          setActiveBeat(0);
          const v = getVoicingForChord(allChords, q[nextChord].key, q[nextChord].suffix);
          if (v) playChord(v, 1.5);
          playMetronomeClick(true);
        }
      } else {
        stateRef.current = { chordIdx, beat: nextBeat, loops };
        setActiveBeat(nextBeat);
        playMetronomeClick(false);
      }
    }, interval);
  }, [bpm, beatsPerChord, loop, allChords, playChord, stopLooper]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Derived builder chord label
  const builderLabel = useMemo(() => {
    return allChords.find(c => c.key === builderRoot && c.suffix === builderSuffix)?.label
      ?? (builderSuffix === "major" ? builderRoot : builderRoot + builderSuffix);
  }, [builderRoot, builderSuffix, allChords]);

  function addChord() {
    setQueue(q => [...q, { key: builderRoot, suffix: builderSuffix, label: builderLabel }]);
  }

  function removeChord(i: number) {
    setQueue(q => q.filter((_, idx) => idx !== i));
    if (playing) stopLooper();
  }

  function loadPreset(preset: typeof QUICK_PRESETS[0]) {
    const resolved = preset.chords.map(({ st, sx }) => {
      const key = semitoneToKey(activeKey, st);
      const chord = allChords.find(c => c.key === key && c.suffix === sx);
      return { key, suffix: sx, label: chord?.label ?? key };
    });
    setQueue(resolved);
    if (playing) stopLooper();
  }

  function openSaveDialog() {
    if (queue.length === 0) return;
    setSaveName(queue.map(c => c.label).join(" – "));
    setSavePromptOpen(true);
  }

  function confirmSave() {
    const name = saveName.trim();
    if (!name || queue.length === 0) return;
    const entry: SavedProgression = {
      id: `sp-${Date.now()}`,
      name,
      chords: queue,
      bpm,
      beatsPerChord,
      savedAt: Date.now(),
    };
    const next = [entry, ...saved];
    setSaved(next);
    persistSavedProgressions(next);
    setSavePromptOpen(false);
    setSaveName("");
  }

  function loadSaved(sp: SavedProgression) {
    setQueue(sp.chords);
    setBpm(sp.bpm);
    setBeatsPerChord(sp.beatsPerChord);
    if (playing) stopLooper();
  }

  function deleteSaved(id: string) {
    const next = saved.filter(s => s.id !== id);
    setSaved(next);
    persistSavedProgressions(next);
  }

  const currentChord = queue[activeIdx];

  return (
    <div className="flex flex-col gap-5">

      {/* Controls */}
      <div className="bg-card rounded-2xl border border-border/40 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">BPM</span>
            <input
              type="number" min={30} max={240} value={bpm}
              onChange={e => setBpm(Math.max(30, Math.min(240, Number(e.target.value))))}
              disabled={playing}
              className="w-14 px-2 py-1 rounded-lg text-xs font-semibold bg-secondary text-foreground text-center outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
          </div>
          <TapTempo onBpmDetected={setBpm} currentBpm={bpm} beatsPerMeasure={4} />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Beats</span>
            {[1, 2, 4].map(b => (
              <button key={b} onClick={() => { setBeatsPerChord(b); if (playing) stopLooper(); }}
                className={`w-8 h-7 rounded-lg text-xs font-bold transition-colors ${
                  beatsPerChord === b ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >{b}</button>
            ))}
          </div>

          <button
            onClick={() => setLoop(l => !l)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              loop ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {loop ? "Loop on" : "Loop off"}
          </button>
        </div>

        {/* Quick presets */}
        <div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Quick presets — key of {activeKey}</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map(p => (
              <button key={p.label} onClick={() => loadPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chord builder */}
      <div className="bg-card rounded-2xl border border-border/40 p-4">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Add chord</p>

        {/* Root */}
        <div className="flex gap-1 flex-wrap mb-2">
          {PLAYABLE_ROOTS.map(r => (
            <button key={r} onClick={() => setBuilderRoot(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                builderRoot === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Suffix */}
        <div className="flex gap-1 flex-wrap mb-3">
          {LOOPER_SUFFIXES.map(s => (
            <button key={s.suffix} onClick={() => setBuilderSuffix(s.suffix)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                builderSuffix === s.suffix ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={addChord}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add {builderLabel}
        </button>
      </div>

      {/* Saved progressions */}
      {saved.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/40 p-4">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Saved ({saved.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {saved.map(sp => (
              <div key={sp.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                <button onClick={() => loadSaved(sp)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-xs font-bold text-foreground truncate">{sp.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {sp.chords.map(c => c.label).join(" · ")} · {sp.bpm} BPM
                  </p>
                </button>
                <button onClick={() => deleteSaved(sp.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue */}
      {queue.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/40 p-4">
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Queue ({queue.length} chords)</p>
            <div className="flex items-center gap-3">
              <button onClick={openSaveDialog}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
              <button onClick={() => { setQueue([]); stopLooper(); }}
                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {savePromptOpen && (
            <div className="mb-3 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") confirmSave();
                  if (e.key === "Escape") { setSavePromptOpen(false); setSaveName(""); }
                }}
                placeholder="Progression name"
                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button onClick={confirmSave}
                disabled={!saveName.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40"
              >
                Save
              </button>
              <button onClick={() => { setSavePromptOpen(false); setSaveName(""); }}
                className="px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {queue.map((ch, i) => (
              <div key={i} className="relative group">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  playing && activeIdx === i
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-secondary text-foreground"
                }`}>
                  {ch.label}
                </span>
                <button
                  onClick={() => removeChord(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playback display */}
      <AnimatePresence>
        {playing && currentChord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-2xl border border-primary/20 p-8 flex flex-col items-center gap-4 shadow-lg"
          >
            {/* Loop counter */}
            {loop && (
              <p className="text-xs text-muted-foreground">
                {loopCount === 0 ? "Loop 1" : `Loop ${loopCount + 1}`}
              </p>
            )}

            {/* Chord name — animates on chord change */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="text-center"
              >
                <p className="text-5xl font-bold text-foreground tracking-tight">{currentChord.label}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {activeIdx + 1} / {queue.length}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Beat dots */}
            <div className="flex gap-3">
              {Array.from({ length: beatsPerChord }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: activeBeat === i ? 1.5 : 1,
                    opacity: activeBeat === i ? 1 : 0.25,
                  }}
                  transition={{ duration: 0.08 }}
                  className={`w-3 h-3 rounded-full ${i === 0 ? "bg-primary" : "bg-foreground"}`}
                />
              ))}
            </div>

            {/* Next chord preview */}
            {queue.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Next: <span className="font-bold text-foreground">{queue[(activeIdx + 1) % queue.length].label}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play / Stop */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground/40">
          <Music2 className="w-10 h-10" />
          <p className="text-sm">Add chords to start looping</p>
        </div>
      ) : (
        <button
          onClick={playing ? stopLooper : startLooper}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-colors ${
            playing
              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {playing
            ? <><Square className="w-5 h-5" /> Stop</>
            : <><Play className="w-5 h-5" /> Start Looping</>
          }
        </button>
      )}
    </div>
  );
}
