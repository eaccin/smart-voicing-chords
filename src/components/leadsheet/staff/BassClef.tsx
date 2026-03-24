import { STAFF_HEIGHT } from "./constants";

export default function BassClef({ x, y }: { x: number; y: number }) {
  return (
    <text
      x={x + 4}
      y={y + STAFF_HEIGHT / 2 + 12}
      fontSize="42"
      fontFamily="serif"
      fill="currentColor"
      className="text-foreground select-none"
    >
      𝄢
    </text>
  );
}
