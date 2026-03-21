import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Disc } from "lucide-react";
import { useMetronome } from "@/hooks/useMetronome";

interface TapTempoProps {
  onBpmDetected: (bpm: number) => void;
  currentBpm: number;
  beatsPerMeasure: number;
}

export default function TapTempo({ onBpmDetected, currentBpm, beatsPerMeasure }: TapTempoProps) {
  const [taps, setTaps] = useState<number[]>([]);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const metronome = useMetronome();

  const handleTap = useCallback(() => {
    const now = Date.now();
    
    // Reset if last tap was more than 2 seconds ago
    setTaps(prev => {
      const filtered = prev.filter(t => now - t < 2000);
      const next = [...filtered, now];
      
      if (next.length >= 2) {
        const intervals = [];
        for (let i = 1; i < next.length; i++) {
          intervals.push(next[i] - next[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(60000 / avgInterval);
        const clampedBpm = Math.max(20, Math.min(300, bpm));
        setDetectedBpm(clampedBpm);
      }
      
      return next;
    });

    // Auto-reset after 2s of no taps
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setTaps([]);
    }, 2500);
  }, []);

  const handleApply = () => {
    if (detectedBpm) {
      onBpmDetected(detectedBpm);
      setDetectedBpm(null);
      setTaps([]);
    }
  };

  const handlePreview = () => {
    if (isPreviewing) {
      metronome.stop();
      setIsPreviewing(false);
    } else {
      metronome.start(currentBpm, beatsPerMeasure);
      setIsPreviewing(true);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tap button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleTap}
        className="px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30 text-accent-foreground hover:bg-accent/30 transition-colors text-xs font-semibold flex items-center gap-1.5"
      >
        <Disc className="w-3.5 h-3.5" />
        Tap
      </motion.button>

      {/* Detected BPM */}
      {detectedBpm && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5"
        >
          <span className="text-xs font-bold text-foreground">{detectedBpm} BPM</span>
          <button
            onClick={handleApply}
            className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/90"
          >
            Apply
          </button>
        </motion.div>
      )}

      {/* Preview button */}
      <button
        onClick={handlePreview}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
          isPreviewing
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {isPreviewing ? "⏹ Stop" : "▶ Preview"}
      </button>

      {/* Beat indicators during preview */}
      {isPreviewing && (
        <div className="flex gap-1">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                metronome.currentBeat === i
                  ? i === 0 ? "bg-primary" : "bg-accent"
                  : "bg-secondary"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
