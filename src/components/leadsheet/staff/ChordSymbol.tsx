export default function ChordSymbol({ x, y, label }: { x: number; y: number; label: string }) {
  const match = label.match(/^([A-G][#b♯♭]?)(.*)/);
  const root = match?.[1] ?? label;
  const suffix = match?.[2] ?? "";

  return (
    <text
      x={x}
      y={y}
      fontFamily="'IBM Plex Mono', monospace"
      fontWeight="700"
      fontSize="13"
      fill="currentColor"
      className="text-primary select-none"
    >
      <tspan>{root}</tspan>
      {suffix && (
        <tspan fontSize="11" fontWeight="600">{suffix}</tspan>
      )}
    </text>
  );
}
