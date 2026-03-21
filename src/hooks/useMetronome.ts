import { useRef, useState, useCallback, useEffect } from "react";

export function useMetronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback((isAccent: boolean) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = isAccent ? 1000 : 700;
    osc.type = "sine";
    gain.gain.setValueAtTime(isAccent ? 0.6 : 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [getAudioCtx]);

  const start = useCallback((bpm: number, beatsPerMeasure: number) => {
    if (bpm <= 0) return;
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Inline stop to avoid stale closure
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    beatRef.current = 0;
    setCurrentBeat(0);
    setIsPlaying(true);

    const interval = (60 / bpm) * 1000;

    // Play first beat immediately
    playClick(true);

    timerRef.current = window.setInterval(() => {
      beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
      setCurrentBeat(beatRef.current);
      playClick(beatRef.current === 0);
    }, interval);
  }, [getAudioCtx, playClick]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    beatRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stop]);

  return { isPlaying, currentBeat, start, stop };
}
