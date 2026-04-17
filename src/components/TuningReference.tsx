import { withSharedAudioContext } from "@/hooks/useAudioContext";
import { getAudioSettings } from "@/hooks/useAudioSettings";

// Standard tuning: E2 A2 D3 G3 B3 E4
const STRINGS = [
  { label: "E", midi: 40 },
  { label: "A", midi: 45 },
  { label: "D", midi: 50 },
  { label: "G", midi: 55 },
  { label: "B", midi: 59 },
  { label: "e", midi: 64 },
];

function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playNote(midi: number) {
  withSharedAudioContext("tuning", (ctx) => {
    const { volume } = getAudioSettings();
    const freq = midiToFreq(midi);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25 * volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.start(now);
    osc.stop(now + 2.6);
  });
}

export default function TuningReference() {
  return (
    <div>
      <span className="text-xs font-semibold text-foreground block mb-2">Tuning</span>
      <div className="flex gap-1">
        {STRINGS.map(s => (
          <button
            key={s.label}
            onClick={() => playNote(s.midi)}
            className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors text-xs font-bold"
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-center">Tap to hear each string</p>
    </div>
  );
}
