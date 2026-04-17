/**
 * Shared synthesis engine — all instrument voices live here.
 * Each function receives the AudioContext, a frequency, start time, and base gain.
 */

import type { Tone, Instrument } from "@/hooks/useAudioSettings";

// ── Guitar ────────────────────────────────────────────────────────────────────
// Strum-style: notes offset by 25ms. Oscillator type controlled by tone.

const GUITAR_CONFIGS: Record<Tone, { fund: OscillatorType; harmMult: number; harmRatio: number }> = {
  soft:   { fund: "sine",     harmMult: 2, harmRatio: 0.05 },
  medium: { fund: "triangle", harmMult: 2, harmRatio: 0.15 },
  bright: { fund: "sawtooth", harmMult: 3, harmRatio: 0.25 },
};

function playGuitar(ctx: AudioContext, freq: number, t: number, gain: number, tone: Tone, dur: number) {
  const cfg = GUITAR_CONFIGS[tone];

  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = cfg.fund;
  osc.frequency.value = freq;
  osc.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(gain * 0.6, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.05);

  const osc2 = ctx.createOscillator();
  const g2   = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = freq * cfg.harmMult;
  osc2.connect(g2); g2.connect(ctx.destination);
  g2.gain.setValueAtTime(0, t);
  g2.gain.linearRampToValueAtTime(gain * cfg.harmRatio, t + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
  osc2.start(t); osc2.stop(t + dur + 0.05);
}

// ── Organ ─────────────────────────────────────────────────────────────────────
// Hammond-style additive synthesis — drawbar harmonics, sustained, organ click.

const ORGAN_HARMONICS = [
  { mult: 0.5, level: 0.06 }, // sub-fundamental
  { mult: 1,   level: 0.42 }, // 16'
  { mult: 2,   level: 0.28 }, // 8'
  { mult: 3,   level: 0.20 }, // 5⅓'
  { mult: 4,   level: 0.13 }, // 4'
  { mult: 6,   level: 0.08 }, // 2⅔'
  { mult: 8,   level: 0.04 }, // 2'
];

function playOrgan(ctx: AudioContext, freq: number, t: number, gain: number, dur: number) {
  ORGAN_HARMONICS.forEach(({ mult, level }) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    osc.connect(g); g.connect(ctx.destination);
    const v = gain * level;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.008);     // organ click (fast)
    g.gain.setValueAtTime(v, t + dur - 0.04);          // sustained flat
    g.gain.linearRampToValueAtTime(0, t + dur + 0.02); // organ release
    osc.start(t); osc.stop(t + dur + 0.08);
  });
}

// ── Synth Pad ─────────────────────────────────────────────────────────────────
// Two detuned saws through a low-pass filter — slow attack, long release, airy.

function playPad(ctx: AudioContext, freq: number, t: number, gain: number, dur: number) {
  const DETUNES   = [-9, 9];
  const ATTACK    = 0.38;
  const RELEASE   = 1.3;
  const CUT_START = 700;
  const CUT_END   = 1400;

  DETUNES.forEach(detune => {
    const osc    = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g      = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;

    filter.type = "lowpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(CUT_START, t);
    filter.frequency.linearRampToValueAtTime(CUT_END, t + ATTACK);   // filter sweep open
    filter.frequency.setValueAtTime(CUT_END, t + dur);
    filter.frequency.linearRampToValueAtTime(CUT_START, t + dur + RELEASE * 0.6);

    osc.connect(filter); filter.connect(g); g.connect(ctx.destination);

    const v = gain * 0.52;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + ATTACK);          // slow attack
    g.gain.setValueAtTime(v, t + dur);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + RELEASE); // long release

    osc.start(t); osc.stop(t + dur + RELEASE + 0.1);
  });
}

// ── Grand Piano ───────────────────────────────────────────────────────────────
// Struck-string model: bright fast attack, quick hammer decay, long string decay.
// Higher harmonics decay faster — gives the "bright top, warm sustain" character.

const PIANO_HARMONICS = [
  { mult: 1,   gainFactor: 1.00, decayMult: 1.2  },
  { mult: 2,   gainFactor: 0.55, decayMult: 0.85 },
  { mult: 3,   gainFactor: 0.28, decayMult: 0.60 },
  { mult: 4,   gainFactor: 0.14, decayMult: 0.40 },
  { mult: 5,   gainFactor: 0.07, decayMult: 0.28 },
  { mult: 6,   gainFactor: 0.04, decayMult: 0.20 },
];

function playGrandPiano(ctx: AudioContext, freq: number, t: number, gain: number, dur: number) {
  PIANO_HARMONICS.forEach(({ mult, gainFactor, decayMult }) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * mult;
    osc.connect(g); g.connect(ctx.destination);

    const peak     = gain * gainFactor;
    const decayEnd = dur * decayMult;

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.003);           // hammer strike (very fast)
    g.gain.exponentialRampToValueAtTime(peak * 0.38, t + 0.06);// initial decay (hammer leaves string)
    g.gain.exponentialRampToValueAtTime(0.001, t + decayEnd);  // string resonance decay

    osc.start(t); osc.stop(t + decayEnd + 0.05);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Play an array of frequencies with the chosen instrument.
 * `stagger` staggers note start times for a strumming effect (guitar).
 */
export function playWithInstrument(
  ctx: AudioContext,
  freqs: number[],
  instrument: Instrument,
  tone: Tone,
  volume: number,
  stagger = false,
  duration?: number,
) {
  const now      = ctx.currentTime;
  const baseGain = (0.22 * volume) / Math.sqrt(freqs.length);

  // Durations feel slightly different per instrument
  const DUR: Record<Instrument, number> = {
    guitar: duration ?? 1.5,
    organ:  duration ?? 2.2,
    pad:    duration ?? 2.8,
    piano:  duration ?? 2.2,
  };
  const dur = DUR[instrument];

  freqs.forEach((freq, i) => {
    const t = stagger && instrument === "guitar" ? now + i * 0.025 : now;
    switch (instrument) {
      case "guitar": playGuitar(ctx, freq, t, baseGain, tone, dur); break;
      case "organ":  playOrgan(ctx, freq, t, baseGain, dur); break;
      case "pad":    playPad(ctx, freq, t, baseGain, dur); break;
      case "piano":  playGrandPiano(ctx, freq, t, baseGain, dur); break;
    }
  });
}
