import { useId, useState } from "react";
import { HelpCircle, Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/i18n-extra";
import { MEASURE_KEYS } from "@/lib/kemis";
import { cn } from "@/lib/utils";

type K = typeof MEASURE_KEYS[number];
const LINES: Record<K, { d: string; label: [number, number] }> = {
  bust: { d: "M38 46 H82", label: [60, 42] },
  waist: { d: "M37 70 H83", label: [60, 66] },
  hips: { d: "M32 92 H88", label: [60, 88] },
  shoulder: { d: "M35 17 H85", label: [60, 12] },
  length: { d: "M66 19 V150", label: [76, 110] },
  sleeves: { d: "M86 19 L103 68", label: [104, 40] },
};
const HELP_KEY: Record<K, "mh_bust" | "mh_waist" | "mh_hips" | "mh_shoulder" | "mh_length" | "mh_sleeves"> =
  { bust: "mh_bust", waist: "mh_waist", hips: "mh_hips", shoulder: "mh_shoulder", length: "mh_length", sleeves: "mh_sleeves" };

export function MeasureDiagram({ k, className }: { k: K; className?: string }) {
  const { t } = useI18n();
  const id = useId();
  const line = LINES[k];
  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-labelledby={id} data-testid={`img-measure-${k}`}>
      <title id={id}>{fmt(t("mhDiagram"), { field: t(k) })}</title>
      <path d="M50 14 Q60 24 70 14 L85 18 L108 66 L96 72 L82 42 L84 70 Q86 78 89 84 L102 150 L18 150 L31 84 Q34 78 36 70 L38 42 L24 72 L12 66 L35 18 Z"
        fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M60 22 V150" stroke="hsl(var(--accent))" strokeWidth="3" opacity=".35" />
      <path d="M22 140 H98" stroke="hsl(var(--accent))" strokeWidth="4" opacity=".45" />
      <path d={line.d} stroke="hsl(var(--clay))" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0" markerStart={`url(#${id}a)`} markerEnd={`url(#${id}a)`} />
      <defs><marker id={`${id}a`} viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5"><circle cx="3" cy="3" r="2.4" fill="hsl(var(--clay))" /></marker></defs>
    </svg>
  );
}

export function MeasureHelpDialog({ open, onOpenChange, initial = "bust", context }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: K; context: "listing" | "profile" }) {
  const { t } = useI18n();
  const [k, setK] = useState<K>(initial);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setK(initial); onOpenChange(o); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-card" data-testid="dialog-measure-help">
        <DialogTitle className="font-display text-2xl text-primary">{t("mhTitle")}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">{context === "profile" ? t("mhProfileAll") : t("garmentMeasureNote")}</DialogDescription>
        <div role="tablist" aria-label={t("measurements")} className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {MEASURE_KEYS.map((x) => (
            <button key={x} type="button" role="tab" aria-selected={k === x} onClick={() => setK(x)} data-testid={`tab-measure-${x}`}
              className={cn("min-h-10 shrink-0 rounded-full border px-3 text-sm", k === x ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>{t(x)}</button>
          ))}
        </div>
        <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr]" role="tabpanel">
          <MeasureDiagram k={k} className="mx-auto h-48 w-36" />
          <div className="space-y-3 text-sm">
            <section className="rounded-xl bg-background p-3 tibeb-edge">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("mhGarmentHead")}</h3>
              <p className="mt-1" data-testid={`text-measure-help-${k}`}>{t(HELP_KEY[k])}</p>
            </section>
            <section className="rounded-xl bg-background p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("mhProfileHead")}</h3>
              <p className="mt-1">{t("mhProfileAll")}</p>
            </section>
          </div>
        </div>
        <p className="flex gap-2 rounded-xl bg-secondary p-3 text-xs"><Ruler className="h-4 w-4 shrink-0 text-accent" aria-hidden />{t("mhNoPromise")}</p>
      </DialogContent>
    </Dialog>
  );
}

/** Opener: full guide button, plus a per-field "?" helper. */
export function useMeasureHelp(context: "listing" | "profile") {
  const { t } = useI18n();
  const [state, setState] = useState<{ open: boolean; k: K }>({ open: false, k: "bust" });
  const openFor = (k: K) => setState({ open: true, k });
  const dialog = <MeasureHelpDialog key={state.k} open={state.open} initial={state.k} context={context} onOpenChange={(o) => setState((s) => ({ ...s, open: o }))} />;
  const guideButton = () => (
    <button type="button" onClick={() => openFor("bust")} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-accent bg-card px-3 text-sm font-semibold text-primary" data-testid={`button-measure-help-${context}`}>
      <Ruler className="h-4 w-4" aria-hidden />{t("mhOpen")}
    </button>
  );
  const fieldHelp = (k: K) => (
    <button type="button" onClick={() => openFor(k)} aria-label={fmt(t("mhFieldHelp"), { field: t(k) })} className="-my-2 grid h-9 w-9 place-items-center rounded-full text-primary" data-testid={`button-measure-help-${context}-${k}`}>
      <HelpCircle className="h-4 w-4" aria-hidden />
    </button>
  );
  return { dialog, guideButton, fieldHelp };
}
