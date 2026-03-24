import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Repeat, Music } from "lucide-react";
import type { LeadSheet, LeadSheetRow, LeadSheetMeasure, LeadSheetChord } from "@/data/leadsheet";
import { createEmptyRow, createEmptyMeasure, createMeasureId } from "@/data/leadsheet";
import type { Meter } from "@/data/songs";
import { getAllChordsWithCustom } from "@/data/chords";
import ChordPicker from "@/components/ChordPicker";

interface LeadSheetEditorProps {
  sheet: LeadSheet;
  meter: Meter;
  onChange: (sheet: LeadSheet) => void;
}

export default function LeadSheetEditor({ sheet, meter, onChange }: LeadSheetEditorProps) {
  const [pickerTarget, setPickerTarget] = useState<{ rowIdx: number; measureIdx: number; beat: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<number | null>(null);

  const beatsPerMeasure = meter.beatsPerMeasure;

  function updateRow(rowIdx: number, updater: (row: LeadSheetRow) => LeadSheetRow) {
    const rows = sheet.rows.map((r, i) => i === rowIdx ? updater({ ...r, measures: r.measures.map(m => ({ ...m, chords: [...m.chords] })) }) : r);
    onChange({ ...sheet, rows });
  }

  function addRow() {
    const labels = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const label = labels[sheet.rows.length % labels.length];
    onChange({ ...sheet, rows: [...sheet.rows, createEmptyRow(label, sheet.measuresPerRow)] });
  }

  function removeRow(idx: number) {
    onChange({ ...sheet, rows: sheet.rows.filter((_, i) => i !== idx) });
  }

  function addMeasure(rowIdx: number) {
    updateRow(rowIdx, row => ({
      ...row,
      measures: [...row.measures, createEmptyMeasure()],
    }));
  }

  function removeMeasure(rowIdx: number, measureIdx: number) {
    updateRow(rowIdx, row => ({
      ...row,
      measures: row.measures.filter((_, i) => i !== measureIdx),
    }));
  }

  function toggleRepeat(rowIdx: number, measureIdx: number) {
    updateRow(rowIdx, row => ({
      ...row,
      measures: row.measures.map((m, i) =>
        i === measureIdx ? { ...m, isRepeat: !m.isRepeat, chords: !m.isRepeat ? [] : m.chords } : m
      ),
    }));
  }

  function addChordToMeasure(rowIdx: number, measureIdx: number, beat: number, chord: LeadSheetChord) {
    updateRow(rowIdx, row => ({
      ...row,
      measures: row.measures.map((m, i) => {
        if (i !== measureIdx) return m;
        // Replace chord on same beat or add
        const filtered = m.chords.filter(c => c.beat !== beat);
        return { ...m, chords: [...filtered, chord].sort((a, b) => a.beat - b.beat) };
      }),
    }));
  }

  function removeChordFromMeasure(rowIdx: number, measureIdx: number, beat: number) {
    updateRow(rowIdx, row => ({
      ...row,
      measures: row.measures.map((m, i) => {
        if (i !== measureIdx) return m;
        return { ...m, chords: m.chords.filter(c => c.beat !== beat) };
      }),
    }));
  }

  function handleChordPicked(chord: { label: string; chordKey: string; suffix: string; voicingIndex: number }) {
    if (!pickerTarget) return;
    const lsChord: LeadSheetChord = {
      label: chord.label,
      chordKey: chord.chordKey,
      suffix: chord.suffix,
      beat: pickerTarget.beat,
      voicingIndex: chord.voicingIndex,
    };
    addChordToMeasure(pickerTarget.rowIdx, pickerTarget.measureIdx, pickerTarget.beat, lsChord);
    setPickerTarget(null);
  }

  return (
    <div className="space-y-3">
      {sheet.rows.map((row, rowIdx) => (
        <div key={row.id} className="relative">
          {/* Row label */}
          <div className="flex items-center gap-2 mb-1.5">
            {editingLabel === rowIdx ? (
              <input
                autoFocus
                value={row.label ?? ""}
                onChange={e => updateRow(rowIdx, r => ({ ...r, label: e.target.value }))}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={e => e.key === "Enter" && setEditingLabel(null)}
                className="w-24 px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-secondary rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/40"
              />
            ) : (
              <button
                onClick={() => setEditingLabel(rowIdx)}
                className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
              >
                {row.label || "Section"}
              </button>
            )}
            <button
              onClick={() => removeRow(rowIdx)}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Measures */}
          <div className="flex flex-wrap gap-1">
            {row.measures.map((measure, measureIdx) => (
              <MeasureCell
                key={measure.id}
                measure={measure}
                beatsPerMeasure={beatsPerMeasure}
                onBeatClick={(beat) => setPickerTarget({ rowIdx, measureIdx, beat })}
                onRemoveChord={(beat) => removeChordFromMeasure(rowIdx, measureIdx, beat)}
                onToggleRepeat={() => toggleRepeat(rowIdx, measureIdx)}
                onRemove={() => removeMeasure(rowIdx, measureIdx)}
              />
            ))}
            <button
              onClick={() => addMeasure(rowIdx)}
              className="w-10 h-16 flex items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground/40 hover:text-muted-foreground hover:border-border transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Add row */}
      <button
        onClick={addRow}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border/50 text-muted-foreground/60 hover:text-muted-foreground hover:border-border text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Row
      </button>

      {/* Chord picker */}
      <AnimatePresence>
        {pickerTarget && (
          <ChordPicker
            onPick={handleChordPicked}
            onClose={() => setPickerTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface MeasureCellProps {
  measure: LeadSheetMeasure;
  beatsPerMeasure: number;
  onBeatClick: (beat: number) => void;
  onRemoveChord: (beat: number) => void;
  onToggleRepeat: () => void;
  onRemove: () => void;
  onDropChord?: (chord: LeadSheetChord, targetBeat: number) => void;
  measureId: string;
  isActive?: boolean;
  activeBeat?: number;
}

function MeasureCell({
  measure,
  beatsPerMeasure,
  onBeatClick,
  onRemoveChord,
  onToggleRepeat,
  onRemove,
  onDropChord,
  measureId,
  isActive,
  activeBeat,
}: MeasureCellProps) {
  const [dragOverBeat, setDragOverBeat] = useState<number | null>(null);
  if (measure.isRepeat) {
    return (
      <div className="relative group">
        <div
          className={`h-16 min-w-[80px] flex items-center justify-center rounded-lg border transition-colors ${
            isActive ? "border-primary bg-primary/10" : "border-border/50 bg-card"
          }`}
        >
          <span className="text-2xl font-bold text-muted-foreground">%</span>
        </div>
        <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onToggleRepeat} className="w-4 h-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <Repeat className="w-2.5 h-2.5" />
          </button>
          <button onClick={onRemove} className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
            <XIcon className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  }

  // Build beat slots
  const chordMap = new Map(measure.chords.map(c => [c.beat, c]));

  return (
    <div className="relative group">
      <div
        className={`h-16 min-w-[80px] flex items-end rounded-lg border overflow-hidden transition-colors ${
          isActive ? "border-primary bg-primary/5" : "border-border/50 bg-card"
        }`}
      >
        {/* Chord symbols row */}
        <div className="flex-1 flex flex-col h-full">
          {/* Chord labels */}
          <div className="flex-1 flex items-center px-1.5 gap-0.5">
            {Array.from({ length: beatsPerMeasure }).map((_, beat) => {
              const chord = chordMap.get(beat);
              const isBeatActive = isActive && activeBeat === beat;
              return (
                <button
                  key={beat}
                  onClick={() => chord ? onRemoveChord(beat) : onBeatClick(beat)}
                  className={`flex-1 h-full flex items-center justify-center text-[11px] font-bold rounded transition-colors ${
                    chord
                      ? isBeatActive
                        ? "text-primary-foreground bg-primary"
                        : "text-foreground hover:text-destructive"
                      : isBeatActive
                        ? "text-primary"
                        : "text-muted-foreground/30 hover:text-muted-foreground/60"
                  }`}
                  title={chord ? `${chord.label} (click to remove)` : `Beat ${beat + 1} (click to add chord)`}
                >
                  {chord ? chord.label : "·"}
                </button>
              );
            })}
          </div>
          {/* Beat slashes */}
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
      </div>
      {/* Hover controls */}
      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onToggleRepeat} className="w-4 h-4 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center" title="Toggle repeat">
          <Repeat className="w-2.5 h-2.5" />
        </button>
        <button onClick={onRemove} className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center" title="Remove measure">
          <XIcon className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

export { MeasureCell };

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3L9 9M9 3L3 9" />
    </svg>
  );
}
