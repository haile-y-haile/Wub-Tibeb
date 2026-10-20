import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Check, CheckCheck, Circle, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMatches, useGetMessages, useGetProfile, useSendMessage, useUpdateExchange,
  getGetMatchesQueryKey, getGetMessagesQueryKey, getGetProfileQueryKey, getGetListingsQueryKey, getGetNotificationsQueryKey,
  type ExchangeInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DemoBadge, ErrorState, SafetyNote } from "@/components/kit";
import { SafetyActions } from "@/components/safety-actions";
import { useMessagePages } from "@/lib/paged-queries";
import { MoreButton } from "@/components/more-button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { errMsg, photoSrc } from "@/lib/kemis";
import { cn } from "@/lib/utils";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, e, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: me } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  const matches = useGetMatches({id},{ query: { queryKey: getGetMatchesQueryKey({id}), refetchInterval: 15000 } });
  const messages = useMessagePages(id);
  const send = useSendMessage();
  const exchange = useUpdateExchange();
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.data?.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.data?.at(-1)?.id]);

  const m = matches.data?.find((x) => x.id === id);
  useEffect(() => { setProposal(m?.proposal ?? ""); }, [m?.id,m?.proposal]);

  if (matches.isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-28 rounded-2xl bg-secondary" /><Skeleton className="h-64 rounded-2xl bg-secondary" /></div>;
  if (matches.error) return <ErrorState onRetry={() => matches.refetch()} />;
  if (!m || !me) return <ErrorState message={t("notFound")} />;

  const mineIsA = m.dressA.ownerId === me.id;
  const mine = mineIsA ? m.dressA : m.dressB;
  const hers = mineIsA ? m.dressB : m.dressA;
  const otherId = m.userA === me.id ? m.userB : m.userA;
  const closed = ["completed", "cancelled", "canceled"].includes(m.status);
  const iAccepted = m.acceptedBy.includes(me.id), sheAccepted = m.acceptedBy.includes(otherId);
  const iDone = m.completedBy.includes(me.id), sheDone = m.completedBy.includes(otherId);
  const bothAccepted = iAccepted && sheAccepted;
  const demo = mine.demo || hers.demo;

  const act = (data: ExchangeInput) => exchange.mutate({ id: m.id, data }, {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMessagesQueryKey(m.id) });
      qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      toast({ title: t("saved") });
    },
    onError: (err) => {
      qc.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
      toast({ title: errMsg(err, t("error")), variant: "destructive" });
    },
  });

  const submitMsg = () => {
    const v = text.trim(); if (!v) return;
    send.mutate({ id: m.id, data: { text: v } }, {
      onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: getGetMessagesQueryKey(m.id) }); },
      onError: (err) => toast({ title: errMsg(err, t("error")), variant: "destructive" }),
    });
  };

  const history = [
    { label: new Intl.DateTimeFormat(lang==="am"?"am-ET":"en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date(m.createdAt)) + " — " + t("itsAMatch"), done: true },
    { label: `${t("proposal")}: ${m.proposal || "—"}`, done: !!m.proposal },
    { label: `${t("you")} — ${t("accepted")}`, done: iAccepted },
    { label: `${t("them")} — ${t("accepted")}`, done: sheAccepted },
    { label: `${t("you")} — ${t("completed")}`, done: iDone },
    { label: `${t("them")} — ${t("completed")}`, done: sheDone },
  ];

  const Party = ({ who, accepted, done }: { who: string; accepted: boolean; done: boolean }) => (
    <div className="flex-1 rounded-xl bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{who}</p>
      <p className="mt-1 flex items-center gap-1 text-sm">{accepted ? <Check className="h-4 w-4 text-primary" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}{accepted ? t("accepted") : t("waiting")}</p>
      <p className="flex items-center gap-1 text-sm">{done ? <CheckCheck className="h-4 w-4 text-primary" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}{done ? t("completed") : t("waiting")}</p>
    </div>
  );

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Link href="/matches" aria-label={t("back")} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card" data-testid="link-back-matches"><ArrowLeft className="h-5 w-5 text-primary" /></Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-semibold text-primary" data-testid="text-match-partner">{hers.ownerName}</h1>
          <p className="text-xs text-muted-foreground">{hers.neighborhood} · <span data-testid="text-match-status">{e(m.status)}</span></p>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {[[t("yourDress"), mine], [t("herDress"), hers]].map(([label, d]) => {
          const l = d as typeof mine;
          return (
            <Link key={l.id} href={`/dress/${l.id}`} className="overflow-hidden rounded-2xl paper" data-testid={`link-match-dress-${l.id}`}>
              <div className="relative aspect-[4/5]"><img src={photoSrc(l.photos[0])} alt={l.title} className="h-full w-full object-cover" />{l.demo && <DemoBadge className="absolute left-2 top-2" />}</div>
              <div className="p-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label as string}</p><p className="truncate text-sm font-semibold">{l.title}</p></div>
            </Link>
          );
        })}
      </div>

      <section className="mx-4 mt-4 overflow-hidden rounded-2xl paper">
        <div className="tibeb-thin" />
        <div className="space-y-3 p-4">
          <div className="flex gap-2"><Party who={t("you")} accepted={iAccepted} done={iDone} /><Party who={t("them")} accepted={sheAccepted} done={sheDone} /></div>
          {demo && <p className="text-sm text-muted-foreground">{t("demoNote")}</p>}
          {!closed && !demo && (
            <>
              <label htmlFor="proposal" className="text-sm font-semibold text-primary">{t("proposal")}</label>
              <Textarea id="proposal" rows={2} maxLength={500} value={proposal} onChange={(ev) => setProposal(ev.target.value)} placeholder={t("proposalHint")} className="bg-background" data-testid="input-proposal" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11" disabled={!proposal.trim() || m.status === "accepted" || exchange.isPending} onClick={() => act({ action: "propose", proposal: proposal.trim() })} data-testid="button-propose">{t("propose")}</Button>
                <Button className="h-11" disabled={!m.proposal || proposal !== m.proposal || iAccepted || exchange.isPending} onClick={() => act({ action: "accept", expectedProposal: m.proposal })} data-testid="button-accept">{t("accept")}</Button>
                <Button className="h-11 bg-accent text-accent-foreground hover:bg-accent/90" disabled={!bothAccepted || iDone || exchange.isPending} onClick={() => act({ action: "complete" })} data-testid="button-complete">{t("complete")}</Button>
                <Button variant="ghost" className="h-11 text-destructive" disabled={m.completedBy.length > 0 || exchange.isPending} onClick={() => setConfirmCancel(true)} data-testid="button-cancel-swap">{t("cancelSwap")}</Button>
              </div>
            </>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-primary">{t("history")}</summary>
            <ol className="mt-2 space-y-1.5 border-l-2 border-accent pl-3">
              {history.map((h, i) => <li key={i} className={cn(h.done ? "text-foreground" : "text-muted-foreground")}>{h.label}</li>)}
              {closed && <li className="font-semibold">{e(m.status)}</li>}
            </ol>
          </details>
        </div>
      </section>

      <div className="mx-4 mt-3"><SafetyNote /></div>

      <section className="mx-4 mt-4 rounded-2xl paper" aria-label={t("chat")}>
        <MoreButton q={messages} earlier />
        <div className="max-h-[50dvh] min-h-40 space-y-2 overflow-y-auto p-3" aria-live="polite">
          {messages.isLoading ? <Skeleton className="h-10 w-2/3 bg-secondary" /> : messages.error ? <ErrorState onRetry={() => messages.refetch()} /> :
            !count ? <p className="py-8 text-center text-sm text-muted-foreground">{t("chatEmpty")}</p> :
            messages.data!.map((msg) => {
              const own = msg.senderId === me.id;
              return (
                <div key={msg.id} className={cn("flex", own ? "justify-end" : "justify-start")} data-testid={`msg-${msg.id}`}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <p className="mt-0.5 text-[10px] opacity-70">{new Intl.DateTimeFormat(lang==="am"?"am-ET":"en-GB",{hour:"2-digit",minute:"2-digit"}).format(new Date(msg.createdAt))}</p>
                  </div>
                </div>
              );
            })}
          <div ref={endRef} />
        </div>
        <form className="flex gap-2 border-t border-border p-2" onSubmit={(ev) => { ev.preventDefault(); submitMsg(); }}>
          <input value={text} onChange={(ev) => setText(ev.target.value)} maxLength={2000} placeholder={t("typeMessage")} aria-label={t("typeMessage")} className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm" data-testid="input-message" />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-full" disabled={!text.trim() || send.isPending || m.status==="cancelled"} aria-label={t("send")} data-testid="button-send"><Send className="h-4 w-4" /></Button>
        </form>
      </section>

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
