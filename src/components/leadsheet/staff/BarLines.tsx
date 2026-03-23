import { STAFF_HEIGHT, BARLINE_WIDTH } from "./constants";

export function BarLine({ x, y }: { x: number; y: number }) {
  return (
    <line
      x1={x}
      y1={y}
      x2={x}
      y2={y + STAFF_HEIGHT}
      stroke="currentColor"
      strokeWidth={BARLINE_WIDTH}
      className="text-foreground"
      opacity={0.4}
    />
  );
}

export function FinalBarLine({ x, y }: { x: number; y: number }) {
  return (
    <g className="text-foreground" stroke="currentColor">
      <line x1={x - 4} y1={y} x2={x - 4} y2={y + STAFF_HEIGHT} strokeWidth={1} opacity={0.4} />
      <line x1={x} y1={y} x2={x} y2={y + STAFF_HEIGHT} strokeWidth={3} opacity={0.6} />
    </g>
  );
}
