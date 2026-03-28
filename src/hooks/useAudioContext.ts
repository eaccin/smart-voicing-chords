let sharedCtx: AudioContext | null = null;
let unlocked = false;

const STORAGE_KEY = "audio-unlocked";

type AudioContextConstructor = new () => AudioContext;

function debugLog(event: string, details?: unknown) {
  console.log(`[audio] ${event}`, details ?? "");
}

function hasStoredUnlockFlag(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
}

function isIOSLikeDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform ?? "";
  const userAgent = navigator.userAgent ?? "";
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getAudioContextConstructor(): AudioContextConstructor {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is only available in the browser");
  }

  const Ctx = window.AudioContext || ((window as Window & typeof globalThis & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext);
  if (!Ctx) {
    throw new Error("Web Audio API is not supported in this browser");
  }
  return Ctx;
}

function getConstructorLabel(Ctx: AudioContextConstructor): "AudioContext" | "webkitAudioContext" {
  return typeof window !== "undefined" && Ctx === window.AudioContext ? "AudioContext" : "webkitAudioContext";
}

function markUnlocked(value: boolean) {
  unlocked = value;
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(STORAGE_KEY, "1");
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}

function playSoundImmediately(ctx: AudioContext, label: string) {
  debugLog("playSoundImmediately", { label, state: ctx.state });
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

function ensureSharedContext(source: string): AudioContext {
  if (sharedCtx && sharedCtx.state !== "closed") {
    return sharedCtx;
  }

  const Ctx = getAudioContextConstructor();
  sharedCtx = new Ctx();
  debugLog("context:create", {
    source,
    constructor: getConstructorLabel(Ctx),
    state: sharedCtx.state,
  });
  return sharedCtx;
}

export function isAudioUnlocked(): boolean {
  if (unlocked) return true;
  if (sharedCtx?.state === "running") {
    unlocked = true;
    return true;
  }
  return false;
}

export function shouldShowAudioUnlockOverlay(): boolean {
  if (isIOSLikeDevice()) {
    return !isAudioUnlocked();
  }
  return !hasStoredUnlockFlag() && !isAudioUnlocked();
}

export function getSharedAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    throw new Error("AudioContext is not unlocked yet");
  }
  debugLog("context:state", { state: sharedCtx.state });
  return sharedCtx;
}

export async function unlockAndPlay(source = "gesture", playback?: (ctx: AudioContext) => void): Promise<AudioContext> {
  const ctx = ensureSharedContext(source);
  debugLog("resume:before", { source, state: ctx.state });
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  debugLog("resume:after", { source, state: ctx.state });

  if (playback) {
    debugLog("playback:start", { source, state: ctx.state });
    playback(ctx);
  } else {
    playSoundImmediately(ctx, source);
  }

  markUnlocked(ctx.state === "running");
  return ctx;
}

export function withSharedAudioContext(label: string, callback: (ctx: AudioContext) => void): void {
  if (sharedCtx?.state === "running") {
    debugLog("playback:start", { label, state: sharedCtx.state });
    callback(sharedCtx);
    return;
  }

  unlockAndPlay(label, callback).catch((error) => {
    markUnlocked(false);
    debugLog("resume:fail", {
      label,
      state: sharedCtx?.state ?? "missing",
      error,
    });
  });
}

export function unlockAudio(source = "overlay"): Promise<AudioContext> {
  return unlockAndPlay(source);
}

export function armAudioUnlockOnNextGesture(): () => void {
  return () => {};
}
