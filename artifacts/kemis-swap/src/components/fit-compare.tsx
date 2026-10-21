import { Link } from "wouter";
import { Check, Ruler, X } from "lucide-react";
import type { Measurements } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/i18n-extra";
import { compareFit, hasFullMeasures } from "@/lib/fit";
import { cn } from "@/lib/utils";

export function FitCompare({ garment, prefs, compact, testId = "fit-compare" }: { garment: Measurements; prefs?: Measurements | null; compact?: boolean; testId?: string }) {
  const { t } = useI18n();
  if (!hasFullMeasures(prefs)) {
    return (
      <div className="rounded-2xl border border-dashed border-accent bg-card p-4 text-sm" data-testid={`${testId}-noprefs`}>
        <p className="flex gap-2"><Ruler className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{t("fitNoPrefs")}</p>
        <Link href="/profile" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid={`${testId}-link-profile`}>{t("fitAddPrefs")}</Link>
      </div>
    );
  }
  const r = compareFit(garment, prefs);
  const diffText = (d: number) => (d === 0 ? t("fitSame") : fmt(t(d > 0 ? "fitLarger" : "fitSmaller"), { n: Math.abs(d) }));
  return (
    <section className="rounded-2xl paper p-4" aria-label={t("fitTitle")} data-testid={testId}>
      {!compact && <h2 className="font-display text-lg font-semibold text-primary">{t("fitTitle")}</h2>}
      <p className="text-xs text-muted-foreground">{t("fitSub")}</p>
      <p className={cn("mt-2 text-sm font-semibold", r.allWithin ? "text-primary" : "text-[hsl(6_55%_38%)]")} data-testid={`${testId}-summary`}>
        {r.allWithin ? t("fitAllWithin") : fmt(t("fitSomeOutside"), { n: r.outside })}
      </p>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr><th scope="col" className="py-1 font-semibold">{t("measurements")}</th>{!compact && <><th scope="col" className="py-1 font-semibold">{t("fitGarment")}</th><th scope="col" className="py-1 font-semibold">{t("fitYours")}</th></>}<th scope="col" className="py-1 font-semibold">{t("fitDiff")}</th></tr>
        </thead>
        <tbody>
          {r.rows.map((row) => (
            <tr key={row.key} className="border-t border-border" data-testid={`${testId}-row-${row.key}`}>
              <th scope="row" className="py-2 pr-2 font-medium">{t(row.key)}</th>
              {!compact && <><td className="py-2">{row.garment} {t("cm")}</td><td className="py-2">{row.preferred} {t("cm")}</td></>}
              <td className="py-2">
                <span className="block">{diffText(row.diff)}</span>
                <span className={cn("inline-flex items-center gap-1 text-[11px]", row.within ? "text-primary" : "text-[hsl(6_55%_38%)]")}>
                  {row.within ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
                  {fmt(t(row.within ? "fitWithin" : "fitOutside"), { n: row.tolerance })}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">{t("fitNoPromise")}</p>
    </section>
  );
}
