import { useMemo, useRef, useEffect, useState } from "react";
import type { LeadSheet, LeadSheetMeasure } from "@/data/leadsheet";
import { getEffectiveChords, flattenMeasures } from "@/data/leadsheet";
import type { Meter } from "@/data/songs";
import {
  STAFF_HEIGHT, CHORD_Y_OFFSET, SYSTEM_PADDING_TOP, SYSTEM_HEIGHT,
  CLEF_WIDTH, TIME_SIG_WIDTH, MIN_MEASURE_WIDTH, MARGIN_LEFT, MARGIN_RIGHT,
} from "./staff/constants";
import type { SystemData } from "./staff/types";
import TrebleClef from "./staff/TrebleClef";
import BassClef from "./staff/BassClef";
import TimeSignature from "./staff/TimeSignature";
import StaffLines from "./staff/StaffLines";
import { BarLine, FinalBarLine } from "./staff/BarLines";
import ChordSymbol from "./staff/ChordSymbol";
import RepeatSign from "./staff/RepeatSign";
import BeatSlashes from "./staff/BeatSlashes";

interface LeadSheetStaffViewProps {
  sheet: LeadSheet;
  meter: Meter;
  title?: string;
  artist?: string;
  clef?: "treble" | "bass";
  activeMeasureIndex?: number;
  activeBeat?: number;
}

/** Renders a single system (one row of staff with measures) */
function StaffSystem({
  system, sysIdx, totalSystems, staffY, systemY, svgWidth, meter, allMeasures, clef,
  activeMeasureIndex, activeBeat,
}: {
  system: SystemData;
  sysIdx: number;
  totalSystems: number;
  staffY: number;
  systemY: number;
  svgWidth: number;
  meter: Meter;
  allMeasures: LeadSheetMeasure[];
  clef: "treble" | "bass";
  activeMeasureIndex?: number;
  activeBeat?: number;
}) {
  const availableWidth = svgWidth - MARGIN_LEFT - MARGIN_RIGHT;
  const prefixWidth = CLEF_WIDTH + (system.showTimeSig ? TIME_SIG_WIDTH : 0);
  const measuresWidth = availableWidth - prefixWidth;
  const measureWidth = system.measures.length > 0
    ? measuresWidth / system.measures.length
    : MIN_MEASURE_WIDTH;
  const startX = MARGIN_LEFT;

  return (
    <g>
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

      <StaffLines x={startX} y={staffY} width={availableWidth} />
      {clef === "bass" ? <BassClef x={startX} y={staffY} /> : <TrebleClef x={startX} y={staffY} />}
      {system.showTimeSig && (
        <TimeSignature x={startX + CLEF_WIDTH} y={staffY} meter={meter} />
      )}
      <BarLine x={startX} y={staffY} />

      {/* Measures */}
      {system.measures.map((mData, mIdx) => {
        const mx = startX + prefixWidth + mIdx * measureWidth;
        const chords = getEffectiveChords(mData.measure, mData.allMeasures, mData.measureIndex);
        const isRepeat = mData.measure.isRepeat;
        const isLast = sysIdx === totalSystems - 1 && mIdx === system.measures.length - 1;

        return (
          <g key={mData.measure.id}>
            {!isRepeat && chords.map((chord, cIdx) => {
              const chordX = chords.length === 1
                ? mx + measureWidth * 0.1
                : mx + (measureWidth * chord.beat) / meter.beatsPerMeasure + 4;
              return (
                <ChordSymbol key={cIdx} x={chordX} y={staffY + CHORD_Y_OFFSET} label={chord.label} />
              );
            })}

            {isRepeat && <RepeatSign x={mx} y={staffY} width={measureWidth} />}

            {!isRepeat && (
              <BeatSlashes
                x={mx} y={staffY} width={measureWidth}
                beatsPerMeasure={meter.beatsPerMeasure} chords={chords}
              />
            )}

            {isLast
              ? <FinalBarLine x={mx + measureWidth} y={staffY} />
              : <BarLine x={mx + measureWidth} y={staffY} />
            }
          </g>
        );
      })}
    </g>
  );
}

export default function LeadSheetStaffView({ sheet, meter, title, artist, clef = "treble" }: LeadSheetStaffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
        currentSystem = { measures: [], label: item.rowLabel, showTimeSig };
        currentX = prefixWidth;
      }

      const measureWidth = Math.max(
        MIN_MEASURE_WIDTH,
        (availableWidth - prefixWidth) / sheet.measuresPerRow
      );

      if (currentX + measureWidth > availableWidth + 10 && currentSystem.measures.length > 0) {
        result.push(currentSystem);
        currentSystem = { measures: [], label: undefined, showTimeSig: false };
        currentX = CLEF_WIDTH;
      }

      currentSystem.measures.push({ measure: item.measure, allMeasures, measureIndex: idx });
      currentX += measureWidth;
    });

    if (currentSystem && currentSystem.measures.length > 0) result.push(currentSystem);
    return result;
  }, [allMeasuresFlat, allMeasures, containerWidth, sheet.measuresPerRow]);

  const titleHeight = title ? 56 : 8;
  const svgHeight = titleHeight + systems.length * SYSTEM_HEIGHT + 16;

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg width={containerWidth} height={svgHeight} viewBox={`0 0 ${containerWidth} ${svgHeight}`} className="block">
        {title && (
          <g>
            <text
              x={containerWidth / 2} y={28} textAnchor="middle"
              fontSize="20" fontWeight="bold" fontFamily="'IBM Plex Mono', monospace"
              fill="currentColor" className="text-foreground"
            >
              {title}
            </text>
            {artist && (
              <text
                x={containerWidth / 2} y={46} textAnchor="middle"
                fontSize="12" fontFamily="'IBM Plex Mono', monospace"
                fill="currentColor" className="text-muted-foreground" opacity={0.6}
              >
                {artist}
              </text>
            )}
          </g>
        )}

        {systems.map((system, sysIdx) => (
          <StaffSystem
            key={sysIdx}
            system={system}
            sysIdx={sysIdx}
            totalSystems={systems.length}
            systemY={titleHeight + sysIdx * SYSTEM_HEIGHT}
            staffY={titleHeight + sysIdx * SYSTEM_HEIGHT + SYSTEM_PADDING_TOP}
            svgWidth={containerWidth}
            meter={meter}
            allMeasures={allMeasures}
            clef={clef}
          />
        ))}
      </svg>
    </div>
  );
}
