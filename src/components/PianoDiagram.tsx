import type { PianoChordVoicing } from "@/data/pianoChords";

interface PianoDiagramProps {
  voicing: PianoChordVoicing;
  size?: "sm" | "lg";
  noteLabels?: string[];
}

// One octave of piano keys starting from C
// We show ~2 octaves (C3 to B4) = MIDI 48-71
const OCTAVE_START = 48; // C3
const TOTAL_KEYS = 24; // 2 octaves

// White key indices within an octave (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
const WHITE_KEY_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_SEMITONES = [1, 3, 6, 8, 10];

function isBlackKey(semitone: number): boolean {
  return BLACK_KEY_SEMITONES.includes(semitone % 12);
}

export default function PianoDiagram({ voicing, size = "lg", noteLabels }: PianoDiagramProps) {
  const isLarge = size === "lg";

  // Determine range to show based on voicing notes
  const minNote = Math.min(...voicing.notes);
  const maxNote = Math.max(...voicing.notes);

  // Show 2 octaves centered on the chord, always starting on C
  let startMidi = Math.floor((minNote - 2) / 12) * 12;
  if (startMidi < 36) startMidi = 36;
  const numSemitones = Math.max(24, Math.ceil((maxNote - startMidi + 3) / 12) * 12);

  // Count white keys
  const whiteKeys: number[] = [];
  const blackKeys: { semitoneOffset: number; whiteKeyIndex: number }[] = [];

  for (let i = 0; i < numSemitones; i++) {
    const semitone = i % 12;
    if (!isBlackKey(semitone)) {
      whiteKeys.push(startMidi + i);
    }
  }

  for (let i = 0; i < numSemitones; i++) {
    const semitone = i % 12;
    if (isBlackKey(semitone)) {
      // Find which white key it sits between
      let wkIdx = 0;
      for (let j = 0; j < whiteKeys.length; j++) {
        if (whiteKeys[j] < startMidi + i) wkIdx = j;
      }
      blackKeys.push({ semitoneOffset: startMidi + i, whiteKeyIndex: wkIdx });
    }
  }

  const whiteKeyWidth = isLarge ? 22 : 12;
  const whiteKeyHeight = isLarge ? 80 : 44;
  const blackKeyWidth = isLarge ? 14 : 8;
  const blackKeyHeight = isLarge ? 50 : 28;

  const totalWidth = whiteKeys.length * whiteKeyWidth;
  const totalHeight = whiteKeyHeight + (isLarge ? 20 : 8);

  const activeNotes = new Set(voicing.notes);
  const activeNoteLabels = new Map(voicing.notes.map((midi, index) => [midi, noteLabels?.[index] ?? ""]));

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={isLarge ? "w-full max-w-[320px]" : "w-full max-w-[140px]"}
    >
      {/* White keys */}
      {whiteKeys.map((midi, i) => {
        const x = i * whiteKeyWidth;
        const isActive = activeNotes.has(midi);
        return (
          <g key={`white-${midi}`}>
            <rect
              x={x}
              y={0}
              width={whiteKeyWidth - 1}
              height={whiteKeyHeight}
              rx={isLarge ? 3 : 1.5}
              fill={isActive ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              opacity={isActive ? 1 : 0.95}
            />
            {isActive && isLarge && (
              <text
                x={x + whiteKeyWidth / 2 - 0.5}
                y={whiteKeyHeight - 6}
                textAnchor="middle"
                fontSize={9}
                fontWeight="600"
                fontFamily="'IBM Plex Mono', monospace"
                fill="hsl(var(--primary-foreground))"
              >
                {activeNoteLabels.get(midi)}
              </text>
            )}
          </g>
        );
      })}

      {/* Black keys */}
      {blackKeys.map(({ semitoneOffset, whiteKeyIndex }) => {
        const x = (whiteKeyIndex + 1) * whiteKeyWidth - blackKeyWidth / 2;
        const isActive = activeNotes.has(semitoneOffset);
        return (
          <g key={`black-${semitoneOffset}`}>
            <rect
              x={x}
              y={0}
              width={blackKeyWidth}
              height={blackKeyHeight}
              rx={isLarge ? 2 : 1}
              fill={isActive ? "hsl(var(--accent))" : "hsl(var(--background))"}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
            />
            {isActive && isLarge && (
              <text
                x={x + blackKeyWidth / 2}
                y={blackKeyHeight - 5}
                textAnchor="middle"
                fontSize={7}
                fontWeight="600"
                fontFamily="'IBM Plex Mono', monospace"
                fill="hsl(var(--accent-foreground))"
              >
                {activeNoteLabels.get(semitoneOffset)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
