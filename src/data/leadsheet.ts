import type { Meter } from "./songs";

export interface LeadSheetChord {
  label: string;
  chordKey: string;
  suffix: string;
  beat: number; // 0-indexed beat position within measure
  voicingIndex: number;
}

export interface LeadSheetMeasure {
  id: string;
  chords: LeadSheetChord[];
  isRepeat?: boolean; // shows % symbol, repeats previous measure
}

export interface LeadSheetRow {
  id: string;
  label?: string; // section label like "A", "B", "Verse", "Chorus"
  sectionType?: string;
  measures: LeadSheetMeasure[];
}

export interface LeadSheet {
  rows: LeadSheetRow[];
  measuresPerRow: number; // typically 4
}

export function createMeasureId(): string {
  return "m" + Math.random().toString(36).slice(2, 8);
}

export function createRowId(): string {
  return "r" + Math.random().toString(36).slice(2, 8);
}

export function createEmptyMeasure(): LeadSheetMeasure {
  return { id: createMeasureId(), chords: [] };
}

export function createEmptyRow(label?: string, measuresPerRow = 4): LeadSheetRow {
  return {
    id: createRowId(),
    label,
    measures: Array.from({ length: measuresPerRow }, () => createEmptyMeasure()),
  };
}

export function createEmptyLeadSheet(): LeadSheet {
  return {
    rows: [createEmptyRow("A")],
    measuresPerRow: 4,
  };
}

/** Get effective chords for a measure (resolves repeats) */
export function getEffectiveChords(
  measure: LeadSheetMeasure,
  allMeasures: LeadSheetMeasure[],
  measureIndex: number
): LeadSheetChord[] {
  if (!measure.isRepeat) return measure.chords;
  // Walk backwards to find a non-repeat measure
  for (let i = measureIndex - 1; i >= 0; i--) {
    if (!allMeasures[i].isRepeat) return allMeasures[i].chords;
  }
  return [];
}

/** Flatten all measures from a lead sheet in order */
export function flattenMeasures(sheet: LeadSheet): { measure: LeadSheetMeasure; rowLabel?: string }[] {
  const result: { measure: LeadSheetMeasure; rowLabel?: string }[] = [];
  for (const row of sheet.rows) {
    for (const m of row.measures) {
      result.push({ measure: m, rowLabel: row.label });
    }
  }
  return result;
}
