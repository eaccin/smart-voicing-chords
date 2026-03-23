import { STAFF_HEIGHT } from "./constants";

export default function RepeatSign({ x, y, width }: { x: number; y: number; width: number }) {
  const cx = x + width / 2;
  const cy = y + STAFF_HEIGHT / 2;
  return (
    <text
      x={cx}
      y={cy + 8}
      textAnchor="middle"
      fontSize="24"
      fontWeight="bold"
      fill="currentColor"
      className="text-muted-foreground select-none"
      opacity={0.6}
    >
      %
    </text>
  );
}
