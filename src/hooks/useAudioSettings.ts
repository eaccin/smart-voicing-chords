import { useState, useEffect } from "react";

export type Tone       = "soft" | "medium" | "bright";
export type Instrument = "guitar" | "organ" | "pad" | "piano";

export interface AudioSettings {
  volume:     number;      // 0–1
  tone:       Tone;        // guitar tone only
  instrument: Instrument;  // active sound
}

const SETTINGS_KEY  = "audio-settings";
const CHANGE_EVENT  = "audio-settings-change";

const defaults: AudioSettings = { volume: 0.7, tone: "medium", instrument: "guitar" };

function load(): AudioSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return defaults;
}

// Module-level singleton so all hooks share the same values
let current: AudioSettings = load();

export function getAudioSettings(): AudioSettings { return current; }

export function setAudioSettings(patch: Partial<AudioSettings>) {
  current = { ...current, ...patch };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(current)); } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** React hook — re-renders when settings change */
export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => load());

  useEffect(() => {
    const handler = () => setSettings({ ...getAudioSettings() });
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  return { settings, setAudioSettings };
}
