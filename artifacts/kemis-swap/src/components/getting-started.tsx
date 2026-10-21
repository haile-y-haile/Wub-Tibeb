import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useListingPages } from "@/lib/paged-queries";
import { useOnboardFlags } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/** Account-scoped first-time checklist. Completion comes from real data: profile, own listings, a sent like. */
export function GettingStarted({ profileDone, setup = false }: { profileDone: boolean; setup?: boolean }) {
  const { t } = useI18n();
  const { userId } = useAuth();
  const { flags, update } = useOnboardFlags(userId);
  const mine = useListingPages({ mine: true }, profileDone && !setup);
  const listed = (mine.data ?? []).some((l) => !l.demo);
  const steps = [
    { id: "profile", title: t("gsProfile"), sub: t("gsProfileSub"), done: profileDone, href: "/profile" },
    { id: "list", title: t("gsList"), sub: t("gsListSub"), done: listed, href: "/wardrobe?new=1" },
    { id: "find", title: t("gsFind"), sub: flags.browsed && !flags.liked ? t("gsFindBrowsed") : t("gsFindSub"), done: !!flags.liked, href: "/discover" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const currentIdx = steps.findIndex((s) => !s.done);
  if (!userId || (!setup && flags.dismissed)) return null;
  if (!setup && mine.isLoading) return null;

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-2xl paper rise" aria-labelledby="gs-title" data-testid="panel-getting-started">
      <div className="tibeb-thin" aria-hidden />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id="gs-title" className="font-display text-lg font-semibold text-primary">{t("gsTitle")}</h2>
            <p className="text-xs text-muted-foreground"><span data-testid="text-gs-progress">{doneCount}</span> {t("gsProgress")}</p>
          </div>
          {!setup && (
            <button type="button" onClick={() => update({ dismissed: true })} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-secondary" data-testid="button-gs-dismiss">
              <X className="h-4 w-4" aria-hidden />{t("gsHide")}
            </button>
          )}
        </div>
        {doneCount === 3 ? <p className="mt-3 text-sm" data-testid="text-gs-all-done">{t("gsAllDone")}</p> : <p className="mt-1 text-xs text-muted-foreground">{t("gsSub")}</p>}
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => {
            const current = i === currentIdx;
            return (
              <li key={s.id} className={cn("flex items-center gap-3 rounded-xl p-2.5", current ? "bg-secondary" : "")} aria-current={current ? "step" : undefined} data-testid={`gs-step-${s.id}`} data-done={s.done}>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold", s.done ? "border-primary bg-primary text-primary-foreground" : current ? "border-accent text-primary" : "border-border text-muted-foreground")}>
                  {s.done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", s.done && "text-muted-foreground line-through decoration-accent")}>{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.done ? t("gsDone") : current ? `${t("gsNow")} · ${s.sub}` : s.sub}</p>
                </div>
                {!s.done && current && !(setup && s.id === "profile") && (
                  <Link href={s.href} className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground" data-testid={`link-gs-${s.id}`}>{t("gsGo")}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
