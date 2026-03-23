import { STAFF_LINES, STAFF_LINE_SPACING } from "./constants";

export default function StaffLines({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g className="text-border" stroke="currentColor">
      {Array.from({ length: STAFF_LINES }, (_, i) => (
        <line
          key={i}
          x1={x}
          y1={y + i * STAFF_LINE_SPACING}
          x2={x + width}
          y2={y + i * STAFF_LINE_SPACING}
          strokeWidth={0.8}
          opacity={0.5}
        />
      ))}
    </g>
  );
}
