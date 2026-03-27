import { useRef, useCallback } from "react";

let sharedCtx: AudioContext | null = null;
let unlocked = false;

const STORAGE_KEY = "audio-unlocked";

export function isAudioUnlocked(): boolean {
  if (unlocked) return true;
  if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
    unlocked = true;
    return true;
  }
  return false;
}

export function getSharedAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function unlockAudio(): Promise<void> {
  const ctx = getSharedAudioContext();
  return ctx.resume().then(() => {
    // Play a silent buffer to fully unlock on iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    unlocked = true;
    localStorage.setItem(STORAGE_KEY, "1");
  });
}
