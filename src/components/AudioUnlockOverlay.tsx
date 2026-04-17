import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  isAudioUnlocked,
  shouldShowAudioUnlockOverlay,
  unlockAudio,
  getSharedAudioContext,
} from "@/hooks/useAudioContext";

// ── Full-screen overlay (iOS only) ────────────────────────────────────────────

function IOSUnlockOverlay({ onDone }: { onDone: () => void }) {
  async function handleTap() {
    try {
      await unlockAudio("overlay-button");
    } catch {
      // ignore — the auto-resume guard will retry on next gesture
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Volume2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Tap to Enable Audio</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          iPhone and iPad require a direct tap to unlock audio playback.
        </p>
        <button
          type="button"
          onClick={handleTap}
          className="mt-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          Enable Audio
        </button>
      </div>
    </div>
  );
}

// ── Small banner (desktop / re-suspend fallback) ──────────────────────────────
// Shown when the AudioContext got suspended after it was previously running
// (e.g. tab went to background). A single tap brings it back.

function AudioSuspendedBanner({ onDismiss }: { onDismiss: () => void }) {
  async function handleTap() {
    try {
      await unlockAudio("banner-button");
    } catch {}
    onDismiss();
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm py-2 px-4 text-white text-xs font-semibold">
      <VolumeX className="w-4 h-4 flex-shrink-0" />
      <span>Audio paused by browser —</span>
      <button
        type="button"
        onClick={handleTap}
        className="underline hover:no-underline transition-all"
      >
        tap to re-enable
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AudioUnlockOverlay() {
  const [showIOS,    setShowIOS]    = useState(shouldShowAudioUnlockOverlay);
  const [showBanner, setShowBanner] = useState(false);

  // Poll every 2 s so we react quickly when the browser suspends the context
  // (e.g. user switches tab and comes back).
  useEffect(() => {
    const check = () => {
      if (isAudioUnlocked()) {
        setShowBanner(false);
        return;
      }
      try {
        const ctx = getSharedAudioContext();
        setShowBanner(ctx.state === "suspended");
      } catch {
        // Context not yet created — nothing to show
      }
    };

    const id = setInterval(check, 2000);
    // Also check immediately when the tab regains focus
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (showIOS)    return <IOSUnlockOverlay onDone={() => setShowIOS(false)} />;
  if (showBanner) return <AudioSuspendedBanner onDismiss={() => setShowBanner(false)} />;
  return null;
}
