import type { LeadSheetMeasure } from "@/data/leadsheet";

export interface SystemData {
  measures: {
    measure: LeadSheetMeasure;
    allMeasures: LeadSheetMeasure[];
    measureIndex: number;
  }[];
  label?: string;
  showTimeSig: boolean;
}
