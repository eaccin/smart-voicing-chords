import { STAFF_HEIGHT } from "./constants";

export default function TrebleClef({ x, y }: { x: number; y: number }) {
  return (
    <text
      x={x + 4}
      y={y + STAFF_HEIGHT / 2 + 14}
      fontSize="46"
      fontFamily="serif"
      fill="currentColor"
      className="text-foreground select-none"
    >
      𝄞
    </text>
  );
}
