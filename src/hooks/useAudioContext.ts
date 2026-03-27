let sharedCtx: AudioContext | null = null;
let unlocked = false;
let listenersArmed = false;

const STORAGE_KEY = "audio-unlocked";

function debugLog(event: string, details?: unknown) {
  console.debug(`[audio] ${event}`, details ?? "");
}

function hasStoredUnlockFlag(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
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
  return !hasStoredUnlockFlag() && !isAudioUnlocked();
}

export function getSharedAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is only available in the browser");
  }

  if (!sharedCtx || sharedCtx.state === "closed") {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    sharedCtx = new Ctx();
    debugLog("context:create", { state: sharedCtx.state });
  }
  debugLog("context:state", { state: sharedCtx.state });
  return sharedCtx;
}

export function withSharedAudioContext(label: string, callback: (ctx: AudioContext) => void): void {
  const ctx = getSharedAudioContext();
  debugLog("playback:start", { label, state: ctx.state });

  const run = () => callback(ctx);

  if (ctx.state === "suspended") {
    debugLog("resume:start", { label, state: ctx.state });
    ctx.resume().then(() => {
      unlocked = ctx.state === "running";
      debugLog("resume:ok", { label, state: ctx.state });
      run();
    }).catch((error) => {
      debugLog("resume:fail", { label, state: ctx.state, error });
    });
    return;
  }

  run();
}

export function unlockAudio(source = "overlay"): Promise<void> {
  const ctx = getSharedAudioContext();
  debugLog("resume:start", { source, state: ctx.state });
  return ctx.resume().then(() => {
    // Play a silent buffer to fully unlock on iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    unlocked = ctx.state === "running";
    debugLog("resume:ok", { source, state: ctx.state });
    if (unlocked) {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  }).catch((error) => {
    debugLog("resume:fail", { source, state: ctx.state, error });
    throw error;
  });
}

export function armAudioUnlockOnNextGesture(): () => void {
  if (typeof document === "undefined" || isAudioUnlocked() || listenersArmed) {
    return () => {};
  }

  listenersArmed = true;
  debugLog("gesture:arm", { storedUnlock: hasStoredUnlockFlag() });

  const handleGesture = () => {
    unlockAudio("gesture-listener").then(cleanup).catch(() => {});
  };

  const cleanup = () => {
    if (!listenersArmed) return;
    listenersArmed = false;
    document.removeEventListener("pointerdown", handleGesture, true);
    document.removeEventListener("touchend", handleGesture, true);
    document.removeEventListener("click", handleGesture, true);
    document.removeEventListener("keydown", handleGesture, true);
    debugLog("gesture:disarm");
  };

  document.addEventListener("pointerdown", handleGesture, true);
  document.addEventListener("touchend", handleGesture, true);
  document.addEventListener("click", handleGesture, true);
  document.addEventListener("keydown", handleGesture, true);

  return cleanup;
}
