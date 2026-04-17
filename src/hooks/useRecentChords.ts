import { useState, useCallback } from "react";

const MAX = 8;
const KEY = "recent-chords";

export interface RecentChord {
  chordKey: string;
  suffix: string;
  label: string;
}

function load(): RecentChord[] {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function save(items: RecentChord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function useRecentChords() {
  const [recent, setRecent] = useState<RecentChord[]>(load);

  const addRecent = useCallback((chord: RecentChord) => {
    setRecent(prev => {
      const filtered = prev.filter(c => !(c.chordKey === chord.chordKey && c.suffix === chord.suffix));
      const next = [chord, ...filtered].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  return { recent, addRecent, clearRecent };
}
