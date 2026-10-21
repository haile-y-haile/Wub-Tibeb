import { ArrowLeftRight } from "lucide-react";
import type { Listing, Measurements } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FitCompare } from "@/components/fit-compare";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/i18n-extra";
import { SmartImg } from "@/lib/low-data";
import { localizedListing } from "@/lib/localized-copy";

export type LikePair = Readonly<{ target: Listing; offered: Listing }>;

export function LikeConfirm({ pair, prefs, pending, error, onCancel, onConfirm }: {
  pair: LikePair | null; prefs?: Measurements | null; pending: boolean; error: string | null; onCancel: () => void; onConfirm: (p: LikePair) => void;
}) {
  const { t, lang } = useI18n();
  const target = pair && localizedListing(pair.target, lang), offered = pair && localizedListing(pair.offered, lang);
  const Card = ({ l, label, testId }: { l: Listing; label: string; testId: string }) => (
    <figure className="min-w-0 flex-1 overflow-hidden rounded-2xl paper" data-testid={testId}>
      <SmartImg path={l.photos[0]} alt={l.title} className="aspect-[4/5] w-full object-cover" />
      <figcaption className="p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="line-clamp-2 text-sm font-semibold">{l.title}</p>
      </figcaption>
    </figure>
  );
  return (
    <Dialog open={!!pair} onOpenChange={(o) => { if (!o && !pending) onCancel(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-card" data-testid="dialog-like-confirm">
        {pair && target && offered && (
          <>
            <DialogTitle className="font-display text-2xl text-primary">{t("lcTitle")}</DialogTitle>
            <div className="flex items-center gap-2">
              <Card l={offered} label={t("offering")} testId="card-confirm-offered" />
              <ArrowLeftRight className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              <Card l={target} label={t("lcGet")} testId="card-confirm-target" />
            </div>
            <DialogDescription className="text-sm text-foreground">{fmt(t("lcExplain"), { name: target.ownerName, offered: offered.title })}</DialogDescription>
            <p className="text-xs text-muted-foreground">{t("lcChange")}</p>
            <details className="rounded-2xl bg-background p-3 text-sm">
              <summary className="min-h-8 cursor-pointer font-semibold text-primary">{t("fitCompareOpen")}</summary>
              <div className="mt-2"><FitCompare garment={target.measurements} prefs={prefs} compact testId="fit-compare-confirm" /></div>
            </details>
            {error && <p className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive" role="alert" data-testid="text-like-error">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 flex-1" onClick={onCancel} disabled={pending} data-testid="button-like-cancel">{t("cancel")}</Button>
              <Button className="h-12 flex-[2]" onClick={() => onConfirm(pair)} disabled={pending} data-testid="button-like-send">{pending ? t("lcSending") : t("lcSend")}</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
