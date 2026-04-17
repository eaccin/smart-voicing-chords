import type { TabMeasure, Subdivision } from "@/data/tab";

interface Props {
  measure: TabMeasure;
  measureIndex: number;
  cols: number;
  beatsPerMeasure: number;
  subdivision: Subdivision;
  onCellChange: (measureIdx: number, stringIdx: number, colIdx: number, value: number | null) => void;
  activeCol?: number;
  selectedCell?: { s: number; c: number } | null;
  onCellSelect?: (measureIdx: number, s: number, c: number) => void;
  pendingInput?: string;
}

const CELL_H = 28;

function getCellWidth(subdivision: Subdivision): number {
  return subdivision === "quarter" ? 56 : subdivision === "eighth" ? 28 : 22;
}

export default function TabMeasureGrid({
  measure,
  measureIndex,
  cols,
  beatsPerMeasure,
  subdivision,
  onCellChange: _onCellChange,
  activeCol = -1,
  selectedCell = null,
  onCellSelect,
  pendingInput = "",
}: Props) {
  const CELL_W = getCellWidth(subdivision);
  const colsPerBeat = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;
  const totalW = cols * CELL_W;

  return (
    <div className="relative" style={{ width: totalW + 2 }}>
      {/* Left bar line */}
      <div className="absolute left-0 top-0 w-[1px] bg-foreground/40" style={{ height: 6 * CELL_H }} />
      {/* Right bar line */}
      <div className="absolute right-0 top-0 w-[1px] bg-foreground/40" style={{ height: 6 * CELL_H }} />

      {/* Beat dividers */}
      {Array.from({ length: beatsPerMeasure - 1 }, (_, b) => {
        const x = (b + 1) * colsPerBeat * CELL_W;
        return (
          <div
            key={b}
            className="absolute top-0 w-[1px] bg-foreground/15"
            style={{ left: x + 1, height: 6 * CELL_H }}
          />
        );
      })}

      {/* Playback column highlight */}
      {activeCol >= 0 && activeCol < cols && (
        <div
          className="absolute top-0 bg-primary/15 pointer-events-none"
          style={{ left: activeCol * CELL_W + 1, width: CELL_W, height: 6 * CELL_H }}
        />
      )}

      {/* Selected cell column guide */}
      {selectedCell && (
        <div
          className="absolute top-0 bg-primary/8 pointer-events-none"
          style={{ left: selectedCell.c * CELL_W + 1, width: CELL_W, height: 6 * CELL_H }}
        />
      )}

      {/* Grid rows */}
      {measure.grid.map((row, s) => (
        <div key={s} className="flex relative" style={{ height: CELL_H }}>
          {/* String line */}
          <div
            className="absolute left-0 right-0 bg-foreground/20"
            style={{ top: CELL_H / 2, height: 1 }}
          />
          {row.map((val, c) => {
            const isSelected = selectedCell?.s === s && selectedCell?.c === c;
            const isDownbeat = c % colsPerBeat === 0;
            const showPending = isSelected && pendingInput !== "";

            return (
              <div
                key={c}
                onClick={() => onCellSelect?.(measureIndex, s, c)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/20 ring-1 ring-inset ring-primary/60"
                    : isDownbeat
                    ? "bg-foreground/[0.03]"
                    : ""
                } hover:bg-primary/10`}
                style={{ width: CELL_W, height: CELL_H }}
              >
                {showPending ? (
                  <span className="text-xs font-mono font-bold text-primary relative z-10">
                    {pendingInput}
                    <span className="animate-pulse">_</span>
                  </span>
                ) : val !== null ? (
                  <span
                    className={`text-xs font-mono font-bold relative z-10 px-[3px] rounded-sm ${
                      isSelected
                        ? "text-primary bg-primary/10"
                        : "text-foreground bg-background"
                    }`}
                  >
                    {val}
                  </span>
                ) : (
                  <span className={`text-[10px] relative z-10 ${isSelected ? "text-primary/40" : "text-foreground/10"}`}>
                    –
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
