import { useCallback } from "react";
import type { ChordVoicing } from "@/data/chords";
import { withSharedAudioContext } from "@/hooks/useAudioContext";

// Standard tuning MIDI note numbers: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getChordFrequencies(voicing: ChordVoicing): number[] {
  const freqs: number[] = [];
  for (let i = 0; i < 6; i++) {
    const pos = voicing.positions[i];
    if (pos === -1) continue; // muted
    const midi = OPEN_STRING_MIDI[i] + pos;
    freqs.push(midiToFrequency(midi));
  }
  return freqs;
}

export function useChordPlayer() {
  const playChord = useCallback((voicing: ChordVoicing, duration = 1.5) => {
    const freqs = getChordFrequencies(voicing);
    if (freqs.length === 0) return;

    withSharedAudioContext("chord-player", (ctx) => {
      const now = ctx.currentTime;
      const gainPerNote = 0.18 / Math.sqrt(freqs.length);

      freqs.forEach((freq, i) => {
        const startTime = now + i * 0.025;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPerNote, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(gainPerNote * 0.6, startTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.value = freq * 2;
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        gain2.gain.setValueAtTime(0, startTime);
        gain2.gain.linearRampToValueAtTime(gainPerNote * 0.15, startTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);

        osc2.start(startTime);
        osc2.stop(startTime + duration + 0.05);
      });
    });
  }, []);

  return { playChord };
}
