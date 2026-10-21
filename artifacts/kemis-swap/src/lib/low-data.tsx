import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { photoSrc } from "@/lib/kemis";
import { cn } from "@/lib/utils";

export type DataPref = "auto" | "on" | "off";
const KEY = "wt:low-data"; // device preference only, no personal data

type Conn = { saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
const conn = () => (navigator as Navigator & { connection?: Conn }).connection;
function systemSaver() {
  const c = conn();
  return !!c?.saveData || c?.effectiveType === "slow-2g" || c?.effectiveType === "2g";
}

type Ctx = { pref: DataPref; setPref: (p: DataPref) => void; lowData: boolean; system: boolean; revealed: Set<string>; reveal: (src: string) => void };
const LowDataCtx = createContext<Ctx | null>(null);

export function LowDataProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<DataPref>(() => {
    const v = localStorage.getItem(KEY);
    return v === "on" || v === "off" ? v : "auto";
  });
  const [system, setSystem] = useState(systemSaver);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const c = conn(); const h = () => setSystem(systemSaver());
    c?.addEventListener?.("change", h);
    return () => c?.removeEventListener?.("change", h);
  }, []);
  const setPref = useCallback((p: DataPref) => {
    setPrefState(p);
    if (p === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, p);
  }, []);
  const reveal = useCallback((src: string) => setRevealed((s) => new Set(s).add(src)), []);
  const value = useMemo(() => ({ pref, setPref, system, lowData: pref === "on" || (pref === "auto" && system), revealed, reveal }), [pref, setPref, system, revealed, reveal]);
  return <LowDataCtx.Provider value={value}>{children}</LowDataCtx.Provider>;
}

export function useLowData() {
  const c = useContext(LowDataCtx);
  if (!c) throw new Error("LowDataProvider missing");
  return c;
}

/** Photo that honours data saver: no request until the member taps. Never pretends a full image is a thumbnail. */
export function SmartImg({ path, alt, className, tiny, eager, testId }: { path?: string; alt: string; className?: string; tiny?: boolean; eager?: boolean; testId?: string }) {
  const { lowData, revealed, reveal } = useLowData();
  const { t } = useI18n();
  const src = photoSrc(path);
  if (!src) return <div className={cn("bg-secondary", className)} aria-hidden />;
  if (lowData && !revealed.has(src)) {
    if (tiny) return <span className={cn("grid place-items-center bg-secondary text-muted-foreground", className)} role="img" aria-label={t("ldNotLoaded")}><ImageOff className="h-3.5 w-3.5" aria-hidden /></span>;
    return (
      <div className={cn("relative grid place-items-center overflow-hidden bg-secondary", className)}>
        <div className="absolute inset-0 opacity-30 tibeb-thin [height:100%] [background-size:18px_18px]" aria-hidden />
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); reveal(src); }}
          className="relative flex min-h-11 flex-col items-center gap-1 rounded-2xl bg-card/95 px-4 py-2 text-xs font-semibold text-primary shadow-sm"
          aria-label={`${t("ldTapLoad")}: ${alt}`} data-testid={testId ? `button-load-${testId}` : "button-load-photo"}>
          <ImageOff className="h-5 w-5" aria-hidden />{t("ldTapLoad")}
        </button>
      </div>
    );
  }
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} className={className} data-testid={testId} />;
}
