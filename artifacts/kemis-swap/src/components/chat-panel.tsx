import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Clock, RotateCcw, Send, X } from "lucide-react";
import { useSendMessage, getGetMessagesQueryKey, type MessageInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/kit";
import { MoreButton } from "@/components/more-button";
import { useI18n } from "@/lib/i18n";
import { useMessagePages } from "@/lib/paged-queries";
import { useOutbox, type OutItem } from "@/lib/outbox";
import { errMsg } from "@/lib/kemis";
import { cn } from "@/lib/utils";

const STARTERS = [["st_length", "stt_length"], ["st_condition", "stt_condition"], ["st_meet", "stt_meet"]] as const;

export function ChatPanel({ matchId, meId, disabled }: { matchId: string; meId: string; disabled: boolean }) {
  const { t, lang } = useI18n();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const messages = useMessagePages(matchId);
  const send = useSendMessage();
  const outbox = useOutbox(userId, matchId);
  const [starter, setStarter] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const serverIds = useMemo(() => new Set((messages.data ?? []).map((m) => m.id)), [messages.data]);
  const count = messages.data?.length ?? 0;
  const { remove } = outbox;

  // Backend message id equals our clientRequestId: once it appears, the local copy is redundant.
  useEffect(() => { remove(outbox.items.filter((i) => serverIds.has(i.id)).map((i) => i.id)); }, [serverIds, outbox.items, remove]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.data?.at(-1)?.id, outbox.items.length]);

  const deliver = async (item: OutItem) => {
    outbox.setState(item.id, "sending");
    setLastError(null);
    try {
      await send.mutateAsync({ id: matchId, data: { text: item.text, clientRequestId: item.id } as MessageInput });
      await qc.invalidateQueries({ queryKey: getGetMessagesQueryKey(matchId) });
      outbox.remove([item.id]);
    } catch (err) {
      outbox.setState(item.id, "failed");
      setLastError(errMsg(err, t("error")));
    }
  };
  const submit = () => {
    const v = outbox.composer.trim();
    if (!v || disabled) return;
    void deliver(outbox.enqueue(v));
  };
  const insert = (text: string, mode: "set" | "append") => {
    const cur = outbox.composer;
    outbox.setComposer(mode === "set" ? text : `${cur.trimEnd()}${cur.trim() ? "\n" : ""}${text}`);
    setStarter(null);
    requestAnimationFrame(() => { const el = inputRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } });
  };
  const time = (iso: string) => new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const pendingVisible = outbox.items.filter((i) => !serverIds.has(i.id));

  return (
    <section className="rounded-2xl paper" aria-label={t("chat")}>
      <MoreButton q={messages} earlier />
      <div className="max-h-[50dvh] min-h-40 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {messages.isLoading ? <Skeleton className="h-10 w-2/3 bg-secondary" /> : messages.error ? <ErrorState onRetry={() => messages.refetch()} /> :
          !count && !pendingVisible.length ? <p className="py-8 text-center text-sm text-muted-foreground">{t("chatEmpty")}</p> :
          messages.data!.map((msg) => {
            const own = msg.senderId === meId;
            return (
              <div key={msg.id} className={cn("flex", own ? "justify-end" : "justify-start")} data-testid={`msg-${msg.id}`}>
                <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-75">{time(msg.createdAt)}{own && <><Check className="h-3 w-3" aria-hidden />{t("msSent")}</>}</p>
                </div>
              </div>
            );
          })}
        {pendingVisible.map((i) => (
          <div key={i.id} className="flex justify-end" data-testid={`msg-pending-${i.id}`} data-state={i.state}>
            <div className={cn("max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-sm", i.state === "failed" ? "border border-destructive/50 bg-card" : "bg-primary/80 text-primary-foreground")}>
              <p className="whitespace-pre-line">{i.text}</p>
              {i.state === "sending" ? (
                <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-80" data-testid={`status-msg-${i.id}`}><Clock className="h-3 w-3" aria-hidden />{t("msSending")}</p>
              ) : (
                <div className="mt-1 space-y-1">
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-destructive" data-testid={`status-msg-${i.id}`}><AlertCircle className="h-3 w-3" aria-hidden />{t("msFailed")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("msUnconfirmed")}</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => void deliver(i)} disabled={disabled} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50" data-testid={`button-retry-msg-${i.id}`}><RotateCcw className="h-3 w-3" aria-hidden />{t("msRetry")}</button>
                    <button type="button" onClick={() => outbox.remove([i.id])} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs" data-testid={`button-remove-msg-${i.id}`}><X className="h-3 w-3" aria-hidden />{t("msDelete")}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {!disabled && (
        <div className="border-t border-border px-2 pt-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("msStarters")}</p>
          <p className="px-1 text-[11px] text-muted-foreground">{t("msStartersHint")}</p>
          <div className="no-scrollbar mt-1 flex gap-1.5 overflow-x-auto pb-1">
            {STARTERS.map(([label, text]) => (
              <button key={label} type="button" onClick={() => (outbox.composer.trim() ? setStarter(t(text)) : insert(t(text), "set"))} className="min-h-10 shrink-0 rounded-full border border-accent bg-card px-3 text-sm" data-testid={`button-starter-${label}`}>{t(label)}</button>
            ))}
          </div>
        </div>
      )}
      {(lastError || outbox.storeFailed) && <p className="px-3 pt-1 text-xs text-destructive" role="alert">{lastError ?? t("draftFailed")}</p>}
      <form className="flex items-end gap-2 p-2" onSubmit={(ev) => { ev.preventDefault(); submit(); }}>
        <textarea ref={inputRef} value={outbox.composer} onChange={(ev) => outbox.setComposer(ev.target.value)} maxLength={2000} rows={outbox.composer.includes("\n") || outbox.composer.length > 60 ? 3 : 1}
          onKeyDown={(ev) => { if (ev.key === "Enter" && !ev.shiftKey && !("ontouchstart" in window)) { ev.preventDefault(); submit(); } }}
          placeholder={t("typeMessage")} aria-label={t("typeMessage")} disabled={!outbox.ready || disabled}
          className="min-h-11 flex-1 resize-none rounded-3xl border border-input bg-background px-4 py-2.5 text-sm" data-testid="input-message" />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" disabled={!outbox.composer.trim() || disabled} aria-label={t("send")} data-testid="button-send"><Send className="h-4 w-4" /></Button>
      </form>

      <AlertDialog open={!!starter} onOpenChange={(o) => !o && setStarter(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle className="font-display">{t("stReplaceTitle")}</AlertDialogTitle><AlertDialogDescription>{t("stReplaceSub")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel data-testid="button-starter-cancel">{t("cancel")}</AlertDialogCancel>
            <Button variant="outline" onClick={() => starter && insert(starter, "set")} data-testid="button-starter-replace">{t("stReplace")}</Button>
            <AlertDialogAction onClick={() => starter && insert(starter, "append")} data-testid="button-starter-append">{t("stAppend")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
