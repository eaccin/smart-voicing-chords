import type { LeadSheetChord } from "@/data/leadsheet";
import { STAFF_LINE_SPACING } from "./constants";

export default function BeatSlashes({ x, y, width, beatsPerMeasure, chords }: {
  x: number;
  y: number;
  width: number;
  beatsPerMeasure: number;
  chords: LeadSheetChord[];
}) {
  const middleY = y + STAFF_LINE_SPACING * 2;
  const slashSize = 5;

  return (
    <g>
      {Array.from({ length: beatsPerMeasure }, (_, beat) => {
        const beatX = x + (width * (beat + 0.5)) / beatsPerMeasure;
        const hasChord = chords.some(c => c.beat === beat);
        return (
          <g key={beat} opacity={hasChord ? 0.6 : 0.25}>
            <line
              x1={beatX - slashSize}
              y1={middleY + slashSize}
              x2={beatX + slashSize}
              y2={middleY - slashSize}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="text-foreground"
            />
          </g>
        );
      })}
    </g>
  );
}
