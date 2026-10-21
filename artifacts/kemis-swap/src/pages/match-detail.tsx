import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMatches, useGetProfile, useUpdateExchange,
  getGetMatchesQueryKey, getGetMessagesQueryKey, getGetProfileQueryKey, getGetListingsQueryKey, getGetNotificationsQueryKey,
  type ExchangeInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DemoBadge, ErrorState, SafetyNote } from "@/components/kit";
import { SafetyActions } from "@/components/safety-actions";
import { ExchangeTracker } from "@/components/exchange-tracker";
import { ChatPanel } from "@/components/chat-panel";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { errMsg } from "@/lib/kemis";
import { SmartImg } from "@/lib/low-data";
import { deriveExchange } from "@/lib/exchange-state";
import { cn } from "@/lib/utils";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, e, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: me } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  const matches = useGetMatches({ id }, { query: { queryKey: getGetMatchesQueryKey({ id }), refetchInterval: 15000 } });
  const exchange = useUpdateExchange();
  const [proposal, setProposal] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const m = matches.data?.find((x) => x.id === id);
  useEffect(() => { setProposal(m?.proposal ?? ""); }, [m?.id, m?.proposal]);

  if (matches.isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-28 rounded-2xl bg-secondary" /><Skeleton className="h-64 rounded-2xl bg-secondary" /></div>;
  if (matches.error) return <ErrorState onRetry={() => matches.refetch()} />;
  if (!m || !me) return <ErrorState message={t("notFound")} />;

  const mineIsA = m.dressA.ownerId === me.id;
  const mine = mineIsA ? m.dressA : m.dressB;
  const hers = mineIsA ? m.dressB : m.dressA;
  const otherId = m.userA === me.id ? m.userB : m.userA;
  const demo = mine.demo || hers.demo;
  const v = deriveExchange({ status: m.status, proposal: m.proposal, acceptedBy: m.acceptedBy, completedBy: m.completedBy, me: me.id, other: otherId, demo });
  const open = v.outcome === "open";
  const localEdited = proposal.trim() !== m.proposal && !!proposal.trim();

  const act = (data: ExchangeInput) => {
    setActionError(null);
    exchange.mutate({ id: m.id, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMessagesQueryKey(m.id) });
        qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        toast({ title: t("saved") });
      },
      onError: (err) => {
        qc.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
        setActionError(errMsg(err, t("error")));
      },
    });
  };

  const fmtDate = (iso: string) => new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  const history = [
    { label: `${fmtDate(m.createdAt)} — ${t("itsAMatch")}`, done: true },
    { label: `${t("proposal")}: ${m.proposal || "—"}`, done: !!m.proposal },
    { label: `${t("you")} — ${t("accepted")}`, done: v.iAccepted },
    { label: `${t("them")} — ${t("accepted")}`, done: v.otherAccepted },
    { label: `${t("you")} — ${t("completed")}`, done: v.iDone },
    { label: `${t("them")} — ${t("completed")}`, done: v.otherDone },
  ];

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Link href="/matches" aria-label={t("back")} className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card" data-testid="link-back-matches"><ArrowLeft className="h-5 w-5 text-primary" /></Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold text-primary" data-testid="text-match-partner">{hers.ownerName}</h1>
          <p className="text-xs text-muted-foreground">{hers.neighborhood} · <span data-testid="text-match-status">{e(m.status)}</span></p>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {([[t("yourDress"), mine], [t("herDress"), hers]] as const).map(([label, l]) => (
          <Link key={l.id} href={`/dress/${l.id}`} className="overflow-hidden rounded-2xl paper" data-testid={`link-match-dress-${l.id}`}>
            <div className="relative aspect-[4/5]"><SmartImg path={l.photos[0]} alt={l.title} className="h-full w-full object-cover" />{l.demo && <DemoBadge className="absolute left-2 top-2" />}</div>
            <div className="p-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold">{l.title}</p></div>
          </Link>
        ))}
      </div>

      <section className="mx-4 mt-4 overflow-hidden rounded-2xl paper">
        <div className="tibeb-thin" />
        <div className="space-y-4 p-4">
          <ExchangeTracker v={v} partner={hers.ownerName} />
          {demo && <p className="text-sm text-muted-foreground">{t("demoNote")}</p>}
          {open && !demo && (
            <div className="space-y-3">
              {m.proposal && (
                <div className="rounded-xl bg-background p-3 text-sm" data-testid="text-current-plan">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("trCurrentPlan")}</p>
                  <p className="mt-0.5 whitespace-pre-line">{m.proposal}</p>
                </div>
              )}
              {v.canPropose && (
                <>
                  <label htmlFor="proposal" className="text-sm font-semibold text-primary">{t("proposal")}</label>
                  <Textarea id="proposal" rows={2} maxLength={500} value={proposal} onChange={(ev) => setProposal(ev.target.value)} placeholder={t("proposalHint")} className="bg-background" data-testid="input-proposal" />
                  {localEdited && m.proposal && <p className="text-xs text-muted-foreground" data-testid="text-plan-edited">{t("planChangedLocal")}</p>}
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                {v.canPropose && <Button variant="outline" className="h-11" disabled={!proposal.trim() || proposal.trim() === m.proposal || exchange.isPending} onClick={() => act({ action: "propose", proposal: proposal.trim() })} data-testid="button-propose">{t("propose")}</Button>}
                {(v.canAccept || (!!m.proposal && !v.iAccepted && m.status !== "accepted")) && (
                  <Button className="h-11" disabled={!v.canAccept || localEdited || exchange.isPending} onClick={() => act({ action: "accept", expectedProposal: m.proposal })} data-testid="button-accept">{t("accept")}</Button>
                )}
                {m.status === "accepted" && (
                  <Button className="col-span-2 h-12 bg-accent text-accent-foreground hover:bg-accent/90" disabled={!v.canComplete || exchange.isPending} onClick={() => act({ action: "complete" })} data-testid="button-complete">{t("complete")}</Button>
                )}
              </div>
              {m.status !== "accepted" && <p className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-complete-locked"><Lock className="h-3.5 w-3.5" aria-hidden />{t("completeLocked")}</p>}
              {v.canCancel ? (
                <Button variant="ghost" className="h-11 w-full text-destructive" disabled={exchange.isPending} onClick={() => setConfirmCancel(true)} data-testid="button-cancel-swap">{t("cancelSwap")}</Button>
              ) : v.handoffStarted && <p className="rounded-xl border border-dashed border-border p-3 text-xs" data-testid="text-no-cancel">{t("noCancelAfterHandoff")}</p>}
              {actionError && <p className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive" role="alert" data-testid="text-exchange-error">{actionError}</p>}
            </div>
          )}
          <details className="text-sm">
            <summary className="min-h-10 cursor-pointer py-2 font-semibold text-primary">{t("history")}</summary>
            <ol className="mt-2 space-y-1.5 border-l-2 border-accent pl-3">
              {history.map((h, i) => <li key={i} className={cn(h.done ? "text-foreground" : "text-muted-foreground")}>{h.label}</li>)}
              {!open && <li className={cn("font-semibold", v.outcome !== "completed" && "text-destructive")} data-testid="text-history-outcome">{e(m.status)} — {t(v.next)}</li>}
            </ol>
          </details>
        </div>
      </section>

      <div className="mx-4 mt-3"><SafetyNote /></div>
      <div className="mx-4 mt-4"><ChatPanel matchId={m.id} meId={me.id} disabled={v.outcome === "cancelled" || v.outcome === "disputeClosed"} /></div>
      <div className="mx-4 mt-3"><SafetyActions listingId={hers.id} userId={otherId} onBlocked={() => setLocation("/matches")} /></div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle className="font-display">{t("cancelSwap")}?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("back")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => act({ action: "cancel" })} data-testid="button-confirm-cancel">{t("cancelSwap")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
