import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { withSharedAudioContext } from "@/hooks/useAudioContext";
import { getAudioSettings } from "@/hooks/useAudioSettings";

function playClick(accent = false) {
  withSharedAudioContext("practice-timer", (ctx) => {
    const { volume } = getAudioSettings();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = accent ? 1000 : 700;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.3 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.1);
  });
}

interface PracticeTimerProps {
  onClose: () => void;
}

export default function PracticeTimer({ onClose }: PracticeTimerProps) {
  const [seconds, setSeconds] = useState(4);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(4);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setRemaining(seconds);
  }, [seconds]);

  const start = useCallback(() => {
    setRemaining(seconds);
    setRunning(true);
    playClick(true);
    let rem = seconds;
    timerRef.current = window.setInterval(() => {
      rem -= 1;
      setRemaining(rem);
      if (rem <= 0) {
        playClick(true);
        rem = seconds;
        setRemaining(seconds);
      } else {
        playClick(false);
      }
    }, 1000);
  }, [seconds]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const circumference = 2 * Math.PI * 22;
  const progress = remaining / seconds;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-4 z-50 bg-card border border-border/50 rounded-2xl shadow-xl p-4 w-52"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-foreground">Practice Timer</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>

      {/* Circular countdown */}
      <div className="flex justify-center mb-3">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 52 52" className="w-16 h-16 -rotate-90">
            <circle cx="26" cy="26" r="22" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
            {remaining}
          </span>
        </div>
      </div>

      {/* Seconds adjuster */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => { const v = Math.max(1, seconds - 1); setSeconds(v); setRemaining(v); }}
          disabled={running}
          className="p-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-muted-foreground w-16 text-center">{seconds}s / chord</span>
        <button
          onClick={() => { const v = Math.min(60, seconds + 1); setSeconds(v); setRemaining(v); }}
          disabled={running}
          className="p-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Start / stop */}
      <button
        onClick={running ? stop : start}
        className={`w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
          running ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        {running ? <><Square className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Start</>}
      </button>
    </motion.div>
  );
}
