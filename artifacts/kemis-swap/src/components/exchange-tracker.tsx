import { Check, Hourglass } from "lucide-react";
import type { ExchangeView } from "@/lib/exchange-state";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/i18n-extra";
import { cn } from "@/lib/utils";

export function ExchangeTracker({ v, partner }: { v: ExchangeView; partner: string }) {
  const { t } = useI18n();
  const closedOther = v.outcome === "cancelled" || v.outcome === "disputeClosed";
  return (
    <div className="space-y-3" data-testid="exchange-tracker">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("trTitle")}</h2>
      <ol className={cn("grid grid-cols-5 gap-1", closedOther && "opacity-60")}>
        {v.steps.map((s, i) => (
          <li key={s.id} className="min-w-0 text-center" aria-current={s.state === "current" ? "step" : undefined} data-testid={`tracker-step-${s.id}`} data-state={s.state}>
            <div className="relative flex justify-center">
              {i > 0 && <span className={cn("absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2", s.state === "todo" ? "bg-border" : "bg-primary")} aria-hidden />}
              <span className={cn("relative grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold",
                s.state === "done" ? "border-primary bg-primary text-primary-foreground" : s.state === "current" ? "border-accent bg-card text-primary" : "border-border bg-card text-muted-foreground")}>
                {s.state === "done" ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
            </div>
            <p className={cn("mt-1 text-[10px] leading-tight", s.state === "current" ? "font-semibold text-primary" : "text-muted-foreground")}>
              {t(`tr_${s.id}`)}<span className="sr-only"> ({t(s.state === "done" ? "trDone" : s.state === "current" ? "trCurrent" : "trUpcoming")})</span>
            </p>
          </li>
        ))}
      </ol>
      <div className={cn("rounded-xl p-3 text-sm", v.outcome === "completed" ? "bg-primary text-primary-foreground" : closedOther ? "border border-dashed border-destructive/50 bg-background" : v.myTurn ? "bg-secondary tibeb-edge" : "bg-background")} role="status" data-testid="text-next-action">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
          {v.outcome === "open" && !v.myTurn && <Hourglass className="h-3.5 w-3.5" aria-hidden />}
          {v.outcome === "open" ? (v.myTurn ? t("trYourTurn") : fmt(t("trWaiting"), { name: partner })) : t("history")}
        </p>
        <p className="mt-0.5">{fmt(t(v.next), { name: partner })}</p>
      </div>
    </div>
  );
}
