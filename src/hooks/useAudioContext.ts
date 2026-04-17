let sharedCtx: AudioContext | null = null;
let unlocked = false;

const STORAGE_KEY = "audio-unlocked";

function debugLog(event: string, details?: unknown) {
  console.log(`[audio] ${event}`, details ?? "");
}

function isIOSLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getAudioContextCtor() {
  if (typeof window === "undefined") throw new Error("No window");
  const Ctx =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) throw new Error("Web Audio API not supported");
  return Ctx;
}

export function markUnlocked(value: boolean) {
  unlocked = value;
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(STORAGE_KEY, "1");
  else localStorage.removeItem(STORAGE_KEY);
}

function ensureContext(): AudioContext {
  if (sharedCtx && sharedCtx.state !== "closed") return sharedCtx;
  const Ctx = getAudioContextCtor();
  sharedCtx = new Ctx();
  debugLog("context:create", { state: sharedCtx.state });
  return sharedCtx;
}

// ── Core: resume then run ─────────────────────────────────────────────────────
//
// Called from React click-handlers, so we're still in the user-gesture
// call stack. Keeping the resume() call synchronous (no await before it)
// ensures browsers accept it as a gesture-driven resume.

function resumeAndRun(ctx: AudioContext, label: string, cb: (ctx: AudioContext) => void) {
  if (ctx.state === "running") {
    debugLog("playback:start", { label });
    cb(ctx);
    markUnlocked(true);
    return;
  }

  // ctx is suspended — resume() must be called synchronously within this
  // function (still on the user-gesture stack). The .then() fires async but
  // the browser has already recorded the gesture before the await.
  ctx.resume().then(() => {
    debugLog("resume:success", { label, state: ctx.state });
    markUnlocked(ctx.state === "running");
    cb(ctx);
  }).catch((err) => {
    debugLog("resume:fail", { label, state: ctx.state, error: err });
  });
}

// ── Auto-resume guard ─────────────────────────────────────────────────────────
//
// Browsers can suspend the AudioContext after the tab goes to the background.
// This listener wakes it back up on the very next user interaction so
// withSharedAudioContext() always finds a running context.

if (typeof document !== "undefined") {
  const autoResume = () => {
    if (sharedCtx && sharedCtx.state === "suspended") {
      sharedCtx.resume().then(() => {
        markUnlocked(sharedCtx?.state === "running");
        debugLog("auto-resume:success");
      }).catch(() => {});
    }
  };
  document.addEventListener("click",      autoResume, { passive: true });
  document.addEventListener("touchstart", autoResume, { passive: true });
  document.addEventListener("keydown",    autoResume, { passive: true });

  // Also resume when the tab regains visibility
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") autoResume();
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function isAudioUnlocked(): boolean {
  if (unlocked) return true;
  if (sharedCtx?.state === "running") {
    unlocked = true;
    return true;
  }
  return false;
}

/** Only show the full-screen overlay on iOS/iPadOS — desktop browsers
 *  resume correctly from button clicks via the auto-resume guard above. */
export function shouldShowAudioUnlockOverlay(): boolean {
  return isIOSLike() && !isAudioUnlocked();
}

/** Main entry point used by every playback call-site. */
export function withSharedAudioContext(label: string, callback: (ctx: AudioContext) => void): void {
  const ctx = ensureContext();
  resumeAndRun(ctx, label, callback);
}

/** Called by the manual "Enable Audio" button / overlay. */
export async function unlockAudio(source = "overlay"): Promise<AudioContext> {
  const ctx = ensureContext();
  await ctx.resume();
  markUnlocked(ctx.state === "running");
  // Play a nearly-silent sound to fully activate the audio pipeline
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.0001;
  osc.start();
  osc.stop(ctx.currentTime + 0.001);
  debugLog("unlock:done", { source, state: ctx.state });
  return ctx;
}

/** Kept for backward compatibility with existing call-sites. */
export async function unlockAndPlay(
  source = "gesture",
  playback?: (ctx: AudioContext) => void,
): Promise<AudioContext> {
  const ctx = ensureContext();
  await ctx.resume();
  markUnlocked(ctx.state === "running");
  if (playback) playback(ctx);
  return ctx;
}

export function getSharedAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") throw new Error("AudioContext not ready");
  return sharedCtx;
}

// No-op kept for any lingering imports
export function armAudioUnlockOnNextGesture(): () => void {
  return () => {};
}
