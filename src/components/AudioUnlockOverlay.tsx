import { useState } from "react";
import { Volume2 } from "lucide-react";
import {
  isAudioUnlocked,
  shouldShowAudioUnlockOverlay,
  unlockAndPlay,
} from "@/hooks/useAudioContext";

export default function AudioUnlockOverlay() {
  const [visible, setVisible] = useState(shouldShowAudioUnlockOverlay());

  if (!visible) return null;

  async function handleTap() {
    try {
      await unlockAndPlay("overlay-button");
      setVisible(!isAudioUnlocked());
    } catch {
      setVisible(true);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Volume2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Tap to Enable Audio</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Audio playback on iPhone and iPad must be unlocked from a direct tap.
        </p>
        <button
          type="button"
          onClick={handleTap}
          className="mt-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          Enable Audio (iPhone/iPad)
        </button>
      </div>
    </div>
  );
}
