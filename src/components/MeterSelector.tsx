import { useState } from "react";
import type { Meter, MeterType } from "@/data/songs";
import { PRESET_METERS } from "@/data/songs";

interface MeterSelectorProps {
  meter: Meter;
  onChange: (meter: Meter) => void;
  compact?: boolean;
}

const meterOptions: MeterType[] = ["4/4", "3/4", "6/8", "2/4", "5/4", "7/8", "custom"];

export default function MeterSelector({ meter, onChange, compact }: MeterSelectorProps) {
  const [showCustom, setShowCustom] = useState(meter.type === "custom");

  function handleSelect(type: MeterType) {
    if (type === "custom") {
      setShowCustom(true);
      onChange({ type: "custom", beatsPerMeasure: meter.beatsPerMeasure, beatUnit: meter.beatUnit });
    } else {
      setShowCustom(false);
      onChange(PRESET_METERS[type]);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className={`${compact ? "text-[11px]" : "text-sm"} text-muted-foreground`}>Meter</label>
      <div className="flex gap-1">
        {meterOptions.map(opt => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={`px-2 py-1 rounded-md font-semibold transition-colors ${
              compact ? "text-[10px]" : "text-xs"
            } ${
              (meter.type === opt || (opt !== "custom" && !showCustom && PRESET_METERS[opt]?.beatsPerMeasure === meter.beatsPerMeasure && PRESET_METERS[opt]?.beatUnit === meter.beatUnit && meter.type !== "custom"))
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={15}
            value={meter.beatsPerMeasure}
            onChange={e => onChange({ type: "custom", beatsPerMeasure: parseInt(e.target.value) || 4, beatUnit: meter.beatUnit })}
            className={`w-12 px-2 py-1 rounded-md bg-secondary text-foreground text-center outline-none focus:ring-2 focus:ring-primary/40 ${compact ? "text-[10px]" : "text-xs"} font-semibold`}
          />
          <span className={`${compact ? "text-[10px]" : "text-xs"} text-muted-foreground`}>/</span>
          <select
            value={meter.beatUnit}
            onChange={e => onChange({ type: "custom", beatsPerMeasure: meter.beatsPerMeasure, beatUnit: parseInt(e.target.value) })}
            className={`px-2 py-1 rounded-md bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${compact ? "text-[10px]" : "text-xs"} font-semibold`}
          >
            {[2, 4, 8, 16].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
