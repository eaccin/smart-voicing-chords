import { useCallback } from "react";
import type { PianoChordVoicing } from "@/data/pianoChords";
import { withSharedAudioContext } from "@/hooks/useAudioContext";
import { getAudioSettings } from "@/hooks/useAudioSettings";
import { playWithInstrument } from "@/lib/synth";

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function usePianoPlayer() {
  const playChord = useCallback((voicing: PianoChordVoicing, duration?: number) => {
    const freqs = voicing.notes.map(midiToFrequency);
    if (freqs.length === 0) return;

    withSharedAudioContext("piano-player", (ctx) => {
      const { volume, tone, instrument } = getAudioSettings();
      // Piano voicings never strum — always simultaneous regardless of instrument
      playWithInstrument(ctx, freqs, instrument, tone, volume, false, duration);
    });
  }, []);

  return { playChord };
}
