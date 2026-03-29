import { useCallback } from "react";
import { withSharedAudioContext } from "@/hooks/useAudioContext";

// Standard tuning MIDI: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
// Index 0 = low E (string 6), but our grid has index 0 = high e
// STRING_LABELS = ["e","B","G","D","A","E"] so grid row 0 = high e (MIDI 64)
const STRING_MIDI = [64, 59, 55, 50, 45, 40]; // grid row 0..5

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function useTabPlayer() {
  const playColumn = useCallback((column: (number | null)[], duration = 0.6) => {
    const notes: number[] = [];
    for (let s = 0; s < 6; s++) {
      const fret = column[s];
      if (fret !== null && fret !== undefined) {
        notes.push(STRING_MIDI[s] + fret);
      }
    }
    if (notes.length === 0) return;

    withSharedAudioContext("tab-player", (ctx) => {
      const now = ctx.currentTime;
      const gainPerNote = 0.2 / Math.sqrt(notes.length);

      notes.forEach((midi, i) => {
        const freq = midiToFreq(midi);
        const startTime = now + i * 0.008;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPerNote, startTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(gainPerNote * 0.5, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        // Harmonic overtone
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.value = freq * 2;
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        gain2.gain.setValueAtTime(0, startTime);
        gain2.gain.linearRampToValueAtTime(gainPerNote * 0.12, startTime + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);

        osc2.start(startTime);
        osc2.stop(startTime + duration + 0.05);
      });
    });
  }, []);

  return { playColumn };
}
