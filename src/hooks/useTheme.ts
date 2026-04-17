import { useState, useEffect } from "react";

export type ThemeMode   = "dark" | "mid" | "light";
export type ThemeAccent = "blue" | "purple" | "green" | "amber";

export interface Theme {
  mode:   ThemeMode;
  accent: ThemeAccent;
}

const KEY      = "app-theme";
const DEFAULTS: Theme = { mode: "dark", accent: "blue" };
const EVENT    = "theme-change";

let current: Theme = (() => {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULTS;
})();

function apply(t: Theme) {
  const el = document.documentElement;
  el.setAttribute("data-mode",   t.mode);
  el.setAttribute("data-accent", t.accent);
}

/** Call once at app startup to restore the saved theme before first render. */
export function initTheme() {
  apply(current);
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(patch: Partial<Theme>) {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch {}
  apply(current);
  window.dispatchEvent(new Event(EVENT));
}

/** React hook — re-renders whenever the theme changes. */
export function useTheme() {
  const [theme, setLocal] = useState<Theme>(getTheme);

  useEffect(() => {
    const handler = () => setLocal({ ...getTheme() });
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return { theme, setTheme };
}
