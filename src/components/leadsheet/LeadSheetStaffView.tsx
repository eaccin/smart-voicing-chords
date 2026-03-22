import { useMemo, useRef, useEffect, useState } from "react";
import type { LeadSheet, LeadSheetMeasure, LeadSheetChord } from "@/data/leadsheet";
import { getEffectiveChords, flattenMeasures } from "@/data/leadsheet";
import type { Meter } from "@/data/songs";

interface LeadSheetStaffViewProps {
  sheet: LeadSheet;
  meter: Meter;
  title?: string;
  artist?: string;
}

// Layout constants
const STAFF_LINE_SPACING = 10;
const STAFF_LINES = 5;
const STAFF_HEIGHT = STAFF_LINE_SPACING * (STAFF_LINES - 1); // 40
const CHORD_Y_OFFSET = -14; // above top staff line
const SYSTEM_PADDING_TOP = 48; // space for section label + chord symbols
const SYSTEM_PADDING_BOTTOM = 16;
const SYSTEM_HEIGHT = SYSTEM_PADDING_TOP + STAFF_HEIGHT + SYSTEM_PADDING_BOTTOM;
const CLEF_WIDTH = 32;
const TIME_SIG_WIDTH = 24;
const BARLINE_WIDTH = 1;
const MIN_MEASURE_WIDTH = 100;
const MARGIN_LEFT = 8;
const MARGIN_RIGHT = 8;

// Treble clef SVG path (simplified)
function TrebleClef({ x, y }: { x: number; y: number }) {
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

function TimeSignature({ x, y, meter }: { x: number; y: number; meter: Meter }) {
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

function StaffLines({ x, y, width }: { x: number; y: number; width: number }) {
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

function BarLine({ x, y }: { x: number; y: number }) {
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

function FinalBarLine({ x, y }: { x: number; y: number }) {
  return (
    <g className="text-foreground" stroke="currentColor">
      <line x1={x - 4} y1={y} x2={x - 4} y2={y + STAFF_HEIGHT} strokeWidth={1} opacity={0.4} />
      <line x1={x} y1={y} x2={x} y2={y + STAFF_HEIGHT} strokeWidth={3} opacity={0.6} />
    </g>
  );
}

function ChordSymbol({ x, y, label }: { x: number; y: number; label: string }) {
  // Parse chord label to render root and suffix differently
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

function RepeatSign({ x, y, width }: { x: number; y: number; width: number }) {
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

/** Renders beat slashes inside a measure */
function BeatSlashes({ x, y, width, beatsPerMeasure, chords }: {
  x: number;
  y: number;
  width: number;
  beatsPerMeasure: number;
  chords: LeadSheetChord[];
}) {
  // Draw small diagonal slash marks on the middle line for each beat
  const slashes: JSX.Element[] = [];
  const middleY = y + STAFF_LINE_SPACING * 2;
  const slashSize = 5;

  for (let beat = 0; beat < beatsPerMeasure; beat++) {
    const beatX = x + (width * (beat + 0.5)) / beatsPerMeasure;
    // Check if this beat has a chord
    const hasChord = chords.some(c => c.beat === beat);

    slashes.push(
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
  }

  return <g>{slashes}</g>;
}

interface SystemData {
  measures: { measure: LeadSheetMeasure; allMeasures: LeadSheetMeasure[]; measureIndex: number }[];
  label?: string;
  showTimeSig: boolean;
}

export default function LeadSheetStaffView({ sheet, meter, title, artist }: LeadSheetStaffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Flatten all measures and build systems
  const allMeasuresFlat = useMemo(() => flattenMeasures(sheet), [sheet]);
  const allMeasures = useMemo(() => allMeasuresFlat.map(m => m.measure), [allMeasuresFlat]);

  const systems = useMemo(() => {
    const availableWidth = containerWidth - MARGIN_LEFT - MARGIN_RIGHT;
    const result: SystemData[] = [];
    let currentSystem: SystemData | null = null;
    let currentX = 0;

    allMeasuresFlat.forEach((item, idx) => {
      const isNewRow = idx === 0 || item.rowLabel !== allMeasuresFlat[idx - 1]?.rowLabel;
      const isFirstSystem = result.length === 0 && !currentSystem;
      const showTimeSig = isFirstSystem || isNewRow;
      const prefixWidth = CLEF_WIDTH + (showTimeSig ? TIME_SIG_WIDTH : 0);

      if (!currentSystem || isNewRow) {
        if (currentSystem) result.push(currentSystem);
        currentSystem = {
          measures: [],
          label: item.rowLabel,
          showTimeSig,
        };
        currentX = prefixWidth;
      }

      const measureWidth = Math.max(
        MIN_MEASURE_WIDTH,
        (availableWidth - prefixWidth) / sheet.measuresPerRow
      );

      // Check if measure fits in current system
      if (currentX + measureWidth > availableWidth + 10 && currentSystem.measures.length > 0) {
        result.push(currentSystem);
        currentSystem = {
          measures: [],
          label: undefined,
          showTimeSig: false,
        };
        currentX = CLEF_WIDTH;
      }

      currentSystem.measures.push({ measure: item.measure, allMeasures, measureIndex: idx });
      currentX += measureWidth;
    });

    if (currentSystem && currentSystem.measures.length > 0) {
      result.push(currentSystem);
    }

    return result;
  }, [allMeasuresFlat, allMeasures, containerWidth, sheet.measuresPerRow]);

  // Title section height
  const titleHeight = title ? 56 : 8;
  const svgHeight = titleHeight + systems.length * SYSTEM_HEIGHT + 16;
  const svgWidth = containerWidth;

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block"
      >
        {/* Title */}
        {title && (
          <g>
            <text
              x={svgWidth / 2}
              y={28}
              textAnchor="middle"
              fontSize="20"
              fontWeight="bold"
              fontFamily="'IBM Plex Mono', monospace"
              fill="currentColor"
              className="text-foreground"
            >
              {title}
            </text>
            {artist && (
              <text
                x={svgWidth / 2}
                y={46}
                textAnchor="middle"
                fontSize="12"
                fontFamily="'IBM Plex Mono', monospace"
                fill="currentColor"
                className="text-muted-foreground"
                opacity={0.6}
              >
                {artist}
              </text>
            )}
          </g>
        )}

        {/* Systems */}
        {systems.map((system, sysIdx) => {
          const systemY = titleHeight + sysIdx * SYSTEM_HEIGHT;
          const staffY = systemY + SYSTEM_PADDING_TOP;
          const availableWidth = svgWidth - MARGIN_LEFT - MARGIN_RIGHT;
          const prefixWidth = CLEF_WIDTH + (system.showTimeSig ? TIME_SIG_WIDTH : 0);
          const measuresWidth = availableWidth - prefixWidth;
          const measureWidth = system.measures.length > 0
            ? measuresWidth / system.measures.length
            : MIN_MEASURE_WIDTH;
          const startX = MARGIN_LEFT;

          return (
            <g key={sysIdx}>
              {/* Section label */}
              {system.label && (
                <text
                  x={startX}
                  y={systemY + 20}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="'IBM Plex Mono', monospace"
                  fill="currentColor"
                  className="text-accent-foreground"
                  letterSpacing="0.05em"
                >
                  {system.label}
                </text>
              )}

              {/* Staff lines */}
              <StaffLines x={startX} y={staffY} width={availableWidth} />

              {/* Treble clef */}
              <TrebleClef x={startX} y={staffY} />

              {/* Time signature */}
              {system.showTimeSig && (
                <TimeSignature x={startX + CLEF_WIDTH} y={staffY} meter={meter} />
              )}

              {/* Opening barline */}
              <BarLine x={startX} y={staffY} />

              {/* Measures */}
              {system.measures.map((mData, mIdx) => {
                const mx = startX + prefixWidth + mIdx * measureWidth;
                const chords = getEffectiveChords(mData.measure, mData.allMeasures, mData.measureIndex);
                const isRepeat = mData.measure.isRepeat;
                const isLast = sysIdx === systems.length - 1 && mIdx === system.measures.length - 1;

                return (
                  <g key={mData.measure.id}>
                    {/* Chord symbols */}
                    {!isRepeat && chords.map((chord, cIdx) => {
                      let chordX: number;
                      if (chords.length === 1) {
                        chordX = mx + measureWidth * 0.1;
                      } else {
                        chordX = mx + (measureWidth * chord.beat) / meter.beatsPerMeasure + 4;
                      }
                      return (
                        <ChordSymbol
                          key={cIdx}
                          x={chordX}
                          y={staffY + CHORD_Y_OFFSET}
                          label={chord.label}
                        />
                      );
                    })}

                    {/* Repeat sign */}
                    {isRepeat && <RepeatSign x={mx} y={staffY} width={measureWidth} />}

                    {/* Beat slashes */}
                    {!isRepeat && (
                      <BeatSlashes
                        x={mx}
                        y={staffY}
                        width={measureWidth}
                        beatsPerMeasure={meter.beatsPerMeasure}
                        chords={chords}
                      />
                    )}

                    {/* Bar line at end of measure */}
                    {isLast ? (
                      <FinalBarLine x={mx + measureWidth} y={staffY} />
                    ) : (
                      <BarLine x={mx + measureWidth} y={staffY} />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
