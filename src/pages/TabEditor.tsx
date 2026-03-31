import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, Play, Square, FileDown } from "lucide-react";
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

export default function TabEditor() {
  const [meter, setMeter] = useState<MeterType>("4/4");
  const [subdivision, setSubdivision] = useState<Subdivision>("eighth");
  const [bpm, setBpm] = useState(120);
  const [countInBars, setCountInBars] = useState(0);
  const [measures, setMeasures] = useState<TabMeasure[]>(() => [
    createEmptyTabMeasure("eighth", 4),
  ]);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState(-1);
  const [activeCol, setActiveCol] = useState(-1);

  const metronome = useMetronome();
  const { playColumn } = useTabPlayer();
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef({ measureIdx: 0, col: 0, countInBeatsLeft: 0 });

  const beatsPerMeasure = METERS.find(m => m.label === meter)!.beats;
  const cols = columnsForSubdivision(subdivision, beatsPerMeasure);
  const colsPerBeat = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;

  // Use a ref for measures so the interval callback always has the latest
  const measuresRef = useRef(measures);
  measuresRef.current = measures;

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

  const addMeasure = () => setMeasures(prev => [...prev, createEmptyTabMeasure(subdivision, beatsPerMeasure)]);
  const removeMeasure = () => { if (measures.length > 1) setMeasures(prev => prev.slice(0, -1)); };
  const clearMeasure = (idx: number) => {
    setMeasures(prev => prev.map((m, i) => i === idx ? createEmptyTabMeasure(subdivision, beatsPerMeasure) : m));
  };

  const updateCell = (measureIdx: number, stringIdx: number, colIdx: number, value: number | null) => {
    setMeasures(prev => prev.map((m, mi) => {
      if (mi !== measureIdx) return m;
      const newGrid = m.grid.map((row, si) => {
        if (si !== stringIdx) return row;
        const newRow = [...row];
        newRow[colIdx] = value;
        return newRow;
      });
      return { ...m, grid: newGrid };
    }));
  };

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
    const currentMeasures = measuresRef.current;
    if (currentMeasures.length === 0) return;
    stopPlayback();
    setPlaying(true);
    metronome.start(bpm, beatsPerMeasure);

    const totalCols = columnsForSubdivision(subdivision, beatsPerMeasure);
    const cpb = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;
    const totalCountInCols = countInBars * beatsPerMeasure * cpb;

    const playCol = (mIdx: number, cIdx: number) => {
      const m = measuresRef.current[mIdx];
      if (!m) return;
      const column = m.grid.map(row => row[cIdx]);
      playColumn(column);
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

    // Interval per subdivision column
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-3 pt-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Guitar Tab Editor</h1>

        {/* Controls row 1: Time, Grid, Bars */}
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

          <div className="flex items-center gap-1.5 ml-auto">
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
                <TabMeasureGrid
                  measure={measure}
                  measureIndex={mi}
                  cols={cols}
                  beatsPerMeasure={beatsPerMeasure}
                  subdivision={subdivision}
                  onCellChange={updateCell}
                  activeCol={activeMeasure === mi ? activeCol : -1}
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
    </div>
  );
}
