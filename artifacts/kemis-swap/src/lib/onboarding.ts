import { useCallback, useEffect, useState } from "react";

// Per-account, non-sensitive onboarding flags (no measurements or listing data).
export type OnboardFlags = { dismissed?: boolean; browsed?: boolean; liked?: boolean };
const key = (uid: string) => `wt:onboard:${uid}`;
const EVT = "wt-onboard";

export function readOnboard(uid: string | null | undefined): OnboardFlags {
  if (!uid) return {};
  try { return JSON.parse(localStorage.getItem(key(uid)) ?? "{}") as OnboardFlags; } catch { return {}; }
}
export function markOnboard(uid: string | null | undefined, patch: OnboardFlags) {
  if (!uid) return;
  const cur = readOnboard(uid);
  if (Object.entries(patch).every(([k, v]) => cur[k as keyof OnboardFlags] === v)) return;
  localStorage.setItem(key(uid), JSON.stringify({ ...cur, ...patch }));
  window.dispatchEvent(new Event(EVT));
}
export function useOnboardFlags(uid: string | null | undefined) {
  const [flags, setFlags] = useState<OnboardFlags>(() => readOnboard(uid));
  useEffect(() => {
    setFlags(readOnboard(uid));
    const h = () => setFlags(readOnboard(uid));
    window.addEventListener(EVT, h); window.addEventListener("storage", h);
    return () => { window.removeEventListener(EVT, h); window.removeEventListener("storage", h); };
  }, [uid]);
  const update = useCallback((p: OnboardFlags) => markOnboard(uid, p), [uid]);
  return { flags, update };
}

// Most recent saved listing result, per account, so the confirmation survives close/reload.
export type LastSaved = { id: string; title: string; kind: "new" | "edit"; at: number };
const savedKey = (uid: string) => `wt:last-saved:${uid}`;
export function readLastSaved(uid: string | null | undefined): LastSaved | null {
  if (!uid) return null;
  try { return JSON.parse(localStorage.getItem(savedKey(uid)) ?? "null") as LastSaved | null; } catch { return null; }
}
export function writeLastSaved(uid: string | null | undefined, v: LastSaved | null) {
  if (!uid) return;
  if (v) localStorage.setItem(savedKey(uid), JSON.stringify(v)); else localStorage.removeItem(savedKey(uid));
}
