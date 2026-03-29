export type Subdivision = "quarter" | "eighth" | "sixteenth";

export interface TabMeasure {
  id: string;
  // 6 strings × N columns; null = empty cell
  // strings[0] = high E (thinnest), strings[5] = low E (thickest)
  grid: (number | null)[][];
}

export const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

export function columnsForSubdivision(sub: Subdivision, beatsPerMeasure: number): number {
  const mult = sub === "quarter" ? 1 : sub === "eighth" ? 2 : 4;
  return beatsPerMeasure * mult;
}

export function createTabMeasureId(): string {
  return "tab_" + Math.random().toString(36).slice(2, 8);
}

export function createEmptyTabMeasure(sub: Subdivision, beatsPerMeasure: number): TabMeasure {
  const cols = columnsForSubdivision(sub, beatsPerMeasure);
  return {
    id: createTabMeasureId(),
    grid: Array.from({ length: 6 }, () => Array(cols).fill(null)),
  };
}

export function resizeMeasureGrid(measure: TabMeasure, newCols: number): TabMeasure {
  return {
    ...measure,
    grid: measure.grid.map(row => {
      if (row.length >= newCols) return row.slice(0, newCols);
      return [...row, ...Array(newCols - row.length).fill(null)];
    }),
  };
}
