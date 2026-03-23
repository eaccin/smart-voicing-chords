import type { Meter } from "@/data/songs";
import { TIME_SIG_WIDTH, STAFF_LINE_SPACING } from "./constants";

export default function TimeSignature({ x, y, meter }: { x: number; y: number; meter: Meter }) {
  const centerX = x + TIME_SIG_WIDTH / 2;
  return (
    <g className="text-foreground" fill="currentColor">
      <text
        x={centerX}
        y={y + STAFF_LINE_SPACING * 1.6}
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fontFamily="serif"
      >
        {meter.beatsPerMeasure}
      </text>
      <text
        x={centerX}
        y={y + STAFF_LINE_SPACING * 3.6}
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fontFamily="serif"
      >
        {meter.beatUnit}
      </text>
    </g>
  );
}
