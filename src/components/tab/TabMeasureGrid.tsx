import { useState, useRef, useEffect } from "react";
import type { TabMeasure, Subdivision } from "@/data/tab";

interface Props {
  measure: TabMeasure;
  measureIndex: number;
  cols: number;
  beatsPerMeasure: number;
  subdivision: Subdivision;
  onCellChange: (measureIdx: number, stringIdx: number, colIdx: number, value: number | null) => void;
  activeCol?: number;
}

const CELL_H = 28;

function getCellWidth(subdivision: Subdivision): number {
  return subdivision === "quarter" ? 56 : subdivision === "eighth" ? 28 : 22;
}

export default function TabMeasureGrid({ measure, measureIndex, cols, beatsPerMeasure, subdivision, onCellChange, activeCol = -1 }: Props) {
  const CELL_W = getCellWidth(subdivision);
  const [editing, setEditing] = useState<{ s: number; c: number } | null>(null);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const colsPerBeat = subdivision === "quarter" ? 1 : subdivision === "eighth" ? 2 : 4;

  function handleCellTap(s: number, c: number) {
    const current = measure.grid[s][c];
    setEditing({ s, c });
    setInputVal(current !== null ? String(current) : "");
  }

  function commitEdit() {
    if (!editing) return;
    const { s, c } = editing;
    const trimmed = inputVal.trim();
    if (trimmed === "" || trimmed === "x" || trimmed === "X") {
      onCellChange(measureIndex, s, c, null);
    } else {
      const num = parseInt(trimmed);
      if (!isNaN(num) && num >= 0 && num <= 24) {
        onCellChange(measureIndex, s, c, num);
      }
    }
    setEditing(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      setEditing(null);
    } else if (e.key === "Backspace" && inputVal === "" && editing) {
      onCellChange(measureIndex, editing.s, editing.c, null);
      setEditing(null);
    }
  }

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

      {/* Active column highlight */}
      {activeCol >= 0 && activeCol < cols && (
        <div
          className="absolute top-0 bg-primary/15 pointer-events-none"
          style={{ left: activeCol * CELL_W + 1, width: CELL_W, height: 6 * CELL_H }}
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
            const isEditing = editing?.s === s && editing?.c === c;
            const isDownbeat = c % colsPerBeat === 0;
            return (
              <div
                key={c}
                onClick={() => handleCellTap(s, c)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isDownbeat ? "bg-foreground/[0.03]" : ""
                } hover:bg-primary/10`}
                style={{ width: CELL_W, height: CELL_H }}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    className="w-6 h-5 text-center text-xs font-mono font-bold bg-primary/20 text-foreground border border-primary/40 rounded-sm outline-none"
                    maxLength={2}
                    inputMode="numeric"
                  />
                ) : val !== null ? (
                  <span className="text-xs font-mono font-bold text-foreground bg-background px-[3px] rounded-sm relative z-10">
                    {val}
                  </span>
                ) : (
                  <span className="text-[10px] text-foreground/10 relative z-10">–</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
