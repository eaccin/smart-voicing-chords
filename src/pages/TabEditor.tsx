import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";
import type { Subdivision, TabMeasure } from "@/data/tab";
import { STRING_LABELS, columnsForSubdivision, createEmptyTabMeasure, resizeMeasureGrid } from "@/data/tab";
import TabMeasureGrid from "@/components/tab/TabMeasureGrid";

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
  const [measures, setMeasures] = useState<TabMeasure[]>(() => [
    createEmptyTabMeasure("eighth", 4),
  ]);

  const beatsPerMeasure = METERS.find(m => m.label === meter)!.beats;
  const cols = columnsForSubdivision(subdivision, beatsPerMeasure);

  // Resize all measures when meter/subdivision changes
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

  const removeMeasure = () => {
    if (measures.length > 1) setMeasures(prev => prev.slice(0, -1));
  };

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-3 pt-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Guitar Tab Editor</h1>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Time Signature */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Time</span>
            {METERS.map(m => (
              <button
                key={m.label}
                onClick={() => changeMeter(m.label)}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  meter === m.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Subdivision */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">Grid</span>
            {SUBDIVISIONS.map(s => (
              <button
                key={s.value}
                onClick={() => changeSubdivision(s.value)}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  subdivision === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Measure controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Button size="sm" variant="outline" onClick={addMeasure} className="gap-1 text-xs">
              <Plus className="w-3 h-3" /> Bar
            </Button>
            <Button size="sm" variant="outline" onClick={removeMeasure} disabled={measures.length <= 1} className="gap-1 text-xs">
              <Minus className="w-3 h-3" /> Bar
            </Button>
          </div>
        </div>

        {/* Tab grid */}
        <div className="overflow-x-auto">
          <div className="flex flex-nowrap gap-0 min-w-min">
            {/* String labels */}
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
                />
                <button
                  onClick={() => clearMeasure(mi)}
                  className="mt-1 mx-auto text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 transition-colors"
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
