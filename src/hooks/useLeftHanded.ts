import { useState, useEffect } from "react";

const KEY = "left-handed";
const EVENT = "left-handed-change";

let current = localStorage.getItem(KEY) === "true";

export function getLeftHanded() { return current; }

export function setLeftHanded(val: boolean) {
  current = val;
  try { localStorage.setItem(KEY, String(val)); } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useLeftHanded() {
  const [leftHanded, setLH] = useState(() => current);
  useEffect(() => {
    const handler = () => setLH(getLeftHanded());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return { leftHanded, setLeftHanded };
}
