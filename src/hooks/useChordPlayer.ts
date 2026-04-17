import { useCallback } from "react";
import type { ChordVoicing } from "@/data/chords";
import { withSharedAudioContext } from "@/hooks/useAudioContext";
import { getAudioSettings } from "@/hooks/useAudioSettings";
import { playWithInstrument } from "@/lib/synth";

// Standard tuning MIDI note numbers: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getChordFrequencies(voicing: ChordVoicing): number[] {
  const freqs: number[] = [];
  for (let i = 0; i < 6; i++) {
    const pos = voicing.positions[i];
    if (pos === -1) continue;
    freqs.push(midiToFrequency(OPEN_STRING_MIDI[i] + pos));
  }
  return freqs;
}

export function useChordPlayer() {
  const playChord = useCallback((voicing: ChordVoicing, duration?: number) => {
    const freqs = getChordFrequencies(voicing);
    if (freqs.length === 0) return;

    withSharedAudioContext("chord-player", (ctx) => {
      const { volume, tone, instrument } = getAudioSettings();
      playWithInstrument(ctx, freqs, instrument, tone, volume, true, duration);
    });
  }, []);

  return { playChord };
}
