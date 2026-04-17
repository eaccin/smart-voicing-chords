import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus, Minus, Trash2, Play, Square, FileDown,
  Undo2, Redo2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import type { Subdivision, TabMeasure } from "@/data/tab";
import { STRING_LABELS, columnsForSubdivision, createEmptyTabMeasure, resizeMeasureGrid } from "@/data/tab";
import TabMeasureGrid from "@/components/tab/TabMeasureGrid";
import { useMetronome } from "@/hooks/useMetronome";
import { useTabPlayer } from "@/hooks/useTabPlayer";
import TapTempo from "@/components/TapTempo";
import { exportTabPdf } from "@/utils/tabPdfExport";

type MeterType = "4/4" | "3/4" | "6/8" | "2/4";
const METERS: { label: MeterType; beats: number }[] = [
  { label: "4/4", beats: 4 },
  { label: "3/4", beats: 3 },
  { label: "6/8", beats: 6 },
  { label: "2/4", beats: 2 },
];
const SUBDIVISIONS: { label: string; value: Subdivision }[] = [
  { label: "♩", value: "quarter" },
  { label: "♪", value: "eighth" },
  { label: "𝅘𝅥𝅯", value: "sixteenth" },
];

type SelectedCell = { measureIdx: number; s: number; c: number };

function snapshot(measures: TabMeasure[]): TabMeasure[] {
  return measures.map(m => ({ ...m, grid: m.grid.map(r => [...r]) }));
}

export default function TabEditor() {
  const [meter, setMeter] = useState<MeterType>("4/4");
  const [subdivision, setSubdivision] = useState<Subdivision>("eighth");
  const [bpm, setBpm] = useState(120);
  const [countInBars, setCountInBars] = useState(0);
  const [measures, setMeasures] = useState<TabMeasure[]>(() => [
    createEmptyTabMeasure("eighth", 4),
  ]);

  // Playback
  const [playing, setPlaying] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState(-1);
  const [activeCol, setActiveCol] = useState(-1);

  // Editor selection
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [pendingInput, setPendingInput] = useState("");

  // Undo / redo (ref-based to avoid stale closures)
  const historyRef = useRef<TabMeasure[][]>([]);
  const futureRef  = useRef<TabMeasure[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const metronome = useMetronome();
  const { playColumn } = useTabPlayer();
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef({ measureIdx: 0, col: 0, countInBeatsLeft: 0 });

  const beatsPerMeasure = METERS.find(m => m.label === meter)!.beats;
  const cols = columnsForSubdivision(subdivision, beatsPerMeasure);
  const colsPerBeat = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;

  // Keep stable refs for keyboard handler
  const measuresRef = useRef(measures);
  measuresRef.current = measures;
  const selectedCellRef = useRef(selectedCell);
  selectedCellRef.current = selectedCell;
  const pendingInputRef = useRef(pendingInput);
  pendingInputRef.current = pendingInput;
  const colsRef = useRef(cols);
  colsRef.current = cols;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  // ── History ──────────────────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-49), snapshot(measuresRef.current)];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    futureRef.current = [snapshot(measuresRef.current), ...futureRef.current.slice(0, 49)];
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setMeasures(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    historyRef.current = [...historyRef.current.slice(-49), snapshot(measuresRef.current)];
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    setMeasures(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  // ── Cell update ───────────────────────────────────────────────────────────

  const updateCell = useCallback((mi: number, si: number, ci: number, value: number | null) => {
    setMeasures(prev => prev.map((m, idx) => {
      if (idx !== mi) return m;
      return {
        ...m,
        grid: m.grid.map((row, s) => {
          if (s !== si) return row;
          const r = [...row];
          r[ci] = value;
          return r;
        }),
      };
    }));
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigateCell = useCallback((mi: number, s: number, c: number, dir: "right" | "left" | "up" | "down") => {
    const totalCols = colsRef.current;
    const totalMeasures = measuresRef.current.length;
    switch (dir) {
      case "right": {
        let nc = c + 1, nm = mi;
        if (nc >= totalCols) { nc = 0; nm = Math.min(nm + 1, totalMeasures - 1); }
        setSelectedCell({ measureIdx: nm, s, c: nc });
        break;
      }
      case "left": {
        let nc = c - 1, nm = mi;
        if (nc < 0) { nc = totalCols - 1; nm = Math.max(nm - 1, 0); }
        setSelectedCell({ measureIdx: nm, s, c: nc });
        break;
      }
      case "down": setSelectedCell({ measureIdx: mi, s: Math.min(s + 1, 5), c }); break;
      case "up":   setSelectedCell({ measureIdx: mi, s: Math.max(s - 1, 0), c }); break;
    }
  }, []);

  // Commit pending keyboard digits and advance right
  const commitPending = useCallback(() => {
    const sc = selectedCellRef.current;
    const pi = pendingInputRef.current;
    if (!sc || !pi) return;
    const num = parseInt(pi);
    if (!isNaN(num) && num >= 0 && num <= 24) {
      pushHistory();
      updateCell(sc.measureIdx, sc.s, sc.c, num);
    }
    setPendingInput("");
    navigateCell(sc.measureIdx, sc.s, sc.c, "right");
  }, [pushHistory, updateCell, navigateCell]);

  // Pick a fret from the panel (immediate commit + advance)
  const pickFret = useCallback((fret: number) => {
    const sc = selectedCellRef.current;
    if (!sc) return;
    pushHistory();
    updateCell(sc.measureIdx, sc.s, sc.c, fret);
    setPendingInput("");
    navigateCell(sc.measureIdx, sc.s, sc.c, "right");
  }, [pushHistory, updateCell, navigateCell]);

  const clearCell = useCallback(() => {
    const sc = selectedCellRef.current;
    if (!sc) return;
    pushHistory();
    updateCell(sc.measureIdx, sc.s, sc.c, null);
    setPendingInput("");
  }, [pushHistory, updateCell]);

  // ── Keyboard handler ──────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Undo / redo — always available
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (playingRef.current) return;

      const sc = selectedCellRef.current;
      const pi = pendingInputRef.current;

      if (!sc) return;
      const { measureIdx, s, c } = sc;

      // Close / cancel
      if (e.key === "Escape") {
        setPendingInput("");
        setSelectedCell(null);
        return;
      }

      // Commit + navigate right
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (pi) commitPending();
        else navigateCell(measureIdx, s, c, "right");
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (pi) { commitPending(); return; }
        navigateCell(measureIdx, s, c, "right");
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (pi) { setPendingInput(""); return; }
        navigateCell(measureIdx, s, c, "left");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (pi) commitPending();
        else navigateCell(measureIdx, s, c, "down");
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (pi) commitPending();
        else navigateCell(measureIdx, s, c, "up");
        return;
      }

      // Backspace
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        if (pi) {
          setPendingInput(p => p.slice(0, -1));
        } else {
          clearCell();
        }
        return;
      }

      // Digit keys — build pending input
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        // Prevent focus stealing from inputs
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        setPendingInput(prev => {
          const combined = prev + e.key;
          const num = parseInt(combined);
          if (num <= 24) return combined;
          return e.key; // start fresh
        });
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, commitPending, navigateCell, clearCell]);

  // ── Measure operations ────────────────────────────────────────────────────

  const changeMeter = useCallback((m: MeterType) => {
    setMeter(m);
    const b = METERS.find(x => x.label === m)!.beats;
    const newCols = columnsForSubdivision(subdivision, b);
    setMeasures(prev => prev.map(meas => resizeMeasureGrid(meas, newCols)));
  }, [subdivision]);

  const changeSubdivision = useCallback((s: Subdivision) => {
    setSubdivision(s);
    const newCols = columnsForSubdivision(s, beatsPerMeasure);
    setMeasures(prev => prev.map(meas => resizeMeasureGrid(meas, newCols)));
  }, [beatsPerMeasure]);

  const addMeasure = () => {
    pushHistory();
    setMeasures(prev => [...prev, createEmptyTabMeasure(subdivision, beatsPerMeasure)]);
  };
  const removeMeasure = () => {
    if (measures.length <= 1) return;
    pushHistory();
    setMeasures(prev => prev.slice(0, -1));
  };
  const clearMeasure = (idx: number) => {
    pushHistory();
    setMeasures(prev => prev.map((m, i) => i === idx ? createEmptyTabMeasure(subdivision, beatsPerMeasure) : m));
  };

  // ── Playback ──────────────────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    metronome.stop();
    setPlaying(false);
    setCountingIn(false);
    setActiveMeasure(-1);
    setActiveCol(-1);
    stateRef.current = { measureIdx: 0, col: 0, countInBeatsLeft: 0 };
  }, [metronome]);

  const startPlayback = useCallback(() => {
    if (measuresRef.current.length === 0) return;
    setSelectedCell(null);
    setPendingInput("");
    stopPlayback();
    setPlaying(true);
    metronome.start(bpm, beatsPerMeasure);

    const totalCols = columnsForSubdivision(subdivision, beatsPerMeasure);
    const cpb = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;
    const totalCountInCols = countInBars * beatsPerMeasure * cpb;

    const playCol = (mIdx: number, cIdx: number) => {
      const m = measuresRef.current[mIdx];
      if (!m) return;
      playColumn(m.grid.map(row => row[cIdx]));
    };

    if (totalCountInCols > 0) {
      setCountingIn(true);
      stateRef.current = { measureIdx: 0, col: 0, countInBeatsLeft: totalCountInCols };
      setActiveMeasure(-1);
      setActiveCol(-1);
    } else {
      stateRef.current = { measureIdx: 0, col: 0, countInBeatsLeft: 0 };
      setActiveMeasure(0);
      setActiveCol(0);
      playCol(0, 0);
    }

    const interval = (60 / bpm / cpb) * 1000;

    timerRef.current = window.setInterval(() => {
      let { measureIdx, col, countInBeatsLeft } = stateRef.current;

      if (countInBeatsLeft > 1) {
        stateRef.current = { measureIdx, col, countInBeatsLeft: countInBeatsLeft - 1 };
        return;
      }
      if (countInBeatsLeft === 1) {
        stateRef.current = { measureIdx: 0, col: 0, countInBeatsLeft: 0 };
        setCountingIn(false);
        setActiveMeasure(0);
        setActiveCol(0);
        playCol(0, 0);
        return;
      }

      col++;
      if (col >= totalCols) {
        col = 0;
        measureIdx++;
        if (measureIdx >= measuresRef.current.length) {
          stopPlayback();
          return;
        }
      }
      stateRef.current = { measureIdx, col, countInBeatsLeft: 0 };
      setActiveMeasure(measureIdx);
      setActiveCol(col);
      playCol(measureIdx, col);
    }, interval);
  }, [bpm, beatsPerMeasure, subdivision, countInBars, metronome, playColumn, stopPlayback]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const pickerOpen = selectedCell !== null && !playing;

  return (
    <div className={`min-h-screen bg-background ${pickerOpen ? "pb-[220px]" : "pb-24"}`}>
      <div className="max-w-4xl mx-auto px-3 pt-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Guitar Tab Editor</h1>

        {/* Controls row 1: Time, Grid, Bars, Undo/Redo */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Time</span>
            {METERS.map(m => (
              <button
                key={m.label}
                onClick={() => changeMeter(m.label)}
                disabled={playing}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
                  meter === m.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Grid</span>
            {SUBDIVISIONS.map(s => (
              <button
                key={s.value}
                onClick={() => changeSubdivision(s.value)}
                disabled={playing}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
                  subdivision === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={undo}
              disabled={!canUndo || playing}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo || playing}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button size="sm" variant="outline" onClick={addMeasure} disabled={playing} className="gap-1 text-xs">
              <Plus className="w-3 h-3" /> Bar
            </Button>
            <Button size="sm" variant="outline" onClick={removeMeasure} disabled={measures.length <= 1 || playing} className="gap-1 text-xs">
              <Minus className="w-3 h-3" /> Bar
            </Button>
          </div>
        </div>

        {/* Controls row 2: BPM, Tap Tempo, Count-in, Play, Export */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">BPM</span>
            <input
              type="number"
              min={30}
              max={300}
              value={bpm}
              onChange={e => setBpm(Math.max(30, Math.min(300, Number(e.target.value))))}
              disabled={playing}
              className="w-14 px-1.5 py-1 rounded-md text-xs font-semibold bg-secondary text-foreground border border-border/50 outline-none text-center disabled:opacity-50"
            />
          </div>

          <TapTempo onBpmDetected={setBpm} currentBpm={bpm} beatsPerMeasure={beatsPerMeasure} />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Count-in</span>
            <select
              value={countInBars}
              onChange={e => setCountInBars(Number(e.target.value))}
              disabled={playing}
              className="px-2 py-1 rounded-md text-xs font-semibold bg-secondary text-foreground border border-border/50 outline-none disabled:opacity-50"
            >
              <option value={0}>None</option>
              <option value={1}>1 bar</option>
              <option value={2}>2 bars</option>
              <option value={4}>4 bars</option>
              <option value={8}>8 bars</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {playing && (
              <div className="flex items-center gap-1.5">
                {countingIn && <span className="text-xs font-bold text-primary animate-pulse">Count-in…</span>}
                <div className="flex gap-1">
                  {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        metronome.currentBeat === i
                          ? i === 0 ? "bg-primary scale-125" : "bg-accent-foreground"
                          : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <Button
              size="sm"
              variant={playing ? "default" : "outline"}
              onClick={playing ? stopPlayback : startPlayback}
              className="gap-1 text-xs"
            >
              {playing ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Play</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportTabPdf({ measures, meter, subdivision, bpm, beatsPerMeasure, title: "Guitar Tab" })}
              disabled={playing}
              className="gap-1 text-xs"
            >
              <FileDown className="w-3 h-3" /> PDF
            </Button>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        {!playing && !selectedCell && (
          <p className="text-[11px] text-muted-foreground/50 mb-3">
            Tap a cell to select · type fret number · arrow keys to navigate · Ctrl+Z to undo
          </p>
        )}

        {/* Tab grid */}
        <div className="overflow-x-auto">
          <div className="flex flex-nowrap gap-0 min-w-min">
            <div className="flex flex-col shrink-0 pt-[1px]">
              {STRING_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="h-7 flex items-center justify-center text-[11px] font-mono font-bold text-muted-foreground w-6"
                >
                  {label}
                </div>
              ))}
            </div>

            {measures.map((measure, mi) => (
              <div key={measure.id} className="flex flex-col shrink-0">
                <div className="text-[10px] text-muted-foreground/40 text-center font-mono mb-0.5">{mi + 1}</div>
                <TabMeasureGrid
                  measure={measure}
                  measureIndex={mi}
                  cols={cols}
                  beatsPerMeasure={beatsPerMeasure}
                  subdivision={subdivision}
                  onCellChange={updateCell}
                  activeCol={activeMeasure === mi ? activeCol : -1}
                  selectedCell={selectedCell?.measureIdx === mi ? { s: selectedCell.s, c: selectedCell.c } : null}
                  onCellSelect={(measureIdx, s, c) => {
                    setPendingInput("");
                    setSelectedCell({ measureIdx, s, c });
                  }}
                  pendingInput={selectedCell?.measureIdx === mi ? pendingInput : ""}
                />
                <button
                  onClick={() => clearMeasure(mi)}
                  disabled={playing}
                  className="mt-1 mx-auto text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" /> clear
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fret picker panel */}
      {pickerOpen && selectedCell && (
        <FretPickerPanel
          selectedCell={selectedCell}
          currentValue={measures[selectedCell.measureIdx]?.grid[selectedCell.s]?.[selectedCell.c] ?? null}
          pendingInput={pendingInput}
          onFretPick={pickFret}
          onClear={clearCell}
          onNavigate={(dir) => {
            if (pendingInput) commitPending();
            else navigateCell(selectedCell.measureIdx, selectedCell.s, selectedCell.c, dir);
          }}
          onClose={() => { setPendingInput(""); setSelectedCell(null); }}
        />
      )}
    </div>
  );
}

// ── Fret Picker Panel ──────────────────────────────────────────────────────────

function FretPickerPanel({
  selectedCell,
  currentValue,
  pendingInput,
  onFretPick,
  onClear,
  onNavigate,
  onClose,
}: {
  selectedCell: SelectedCell;
  currentValue: number | null;
  pendingInput: string;
  onFretPick: (fret: number) => void;
  onClear: () => void;
  onNavigate: (dir: "left" | "right" | "up" | "down") => void;
  onClose: () => void;
}) {
  const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];
  const displayVal = pendingInput !== ""
    ? pendingInput
    : currentValue !== null ? String(currentValue) : "–";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[55] bg-card border-t border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 pt-2 pb-1.5 border-b border-border/40">
        <span className="text-xs text-muted-foreground">
          String <span className="font-bold text-foreground font-mono">{STRING_NAMES[selectedCell.s]}</span>
          <span className="mx-1">·</span>
          Bar <span className="font-bold text-foreground">{selectedCell.measureIdx + 1}</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-base font-mono font-bold text-primary min-w-[2rem] text-right">
            {pendingInput ? pendingInput + "▍" : (currentValue !== null ? currentValue : "–")}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fret buttons: 0–12 then 13–24 */}
      <div className="px-2 pt-2 pb-1">
        <div className="flex gap-1 mb-1.5 justify-center">
          {Array.from({ length: 13 }, (_, i) => (
            <button
              key={i}
              onClick={() => onFretPick(i)}
              className={`flex-1 h-9 rounded-lg text-xs font-mono font-bold transition-colors ${
                currentValue === i && !pendingInput
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/70 active:bg-primary/30"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex gap-1 mb-2 justify-center">
          {Array.from({ length: 12 }, (_, i) => i + 13).map(fret => (
            <button
              key={fret}
              onClick={() => onFretPick(fret)}
              className={`flex-1 h-9 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                currentValue === fret && !pendingInput
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-primary/30"
              }`}
            >
              {fret}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation + clear row */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <div className="flex gap-1">
          <button onClick={() => onNavigate("up")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground active:bg-secondary/60">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => onNavigate("down")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground active:bg-secondary/60">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => onNavigate("left")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground active:bg-secondary/60">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => onNavigate("right")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground active:bg-secondary/60">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs font-semibold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear cell
        </button>
      </div>
    </div>
  );
}
