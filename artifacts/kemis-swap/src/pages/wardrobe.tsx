import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { CheckCircle2, HardDrive, Pencil, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteListing, getGetListingsQueryKey, type Listing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, GridSkeleton, ListingCard, PageHeader } from "@/components/kit";
import { useListingPages } from "@/lib/paged-queries";
import { MoreButton } from "@/components/more-button";
import { ListingWizard } from "@/components/listing-wizard";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/i18n-extra";
import { errMsg } from "@/lib/kemis";
import { getItem, scopedKey } from "@/lib/device-store";
import { readLastSaved, writeLastSaved, type LastSaved } from "@/lib/onboarding";
import type { ListingDraft } from "@/lib/listing-draft";

export default function Wardrobe() {
  const { t, e, lang } = useI18n();
  const { toast } = useToast();
  const { userId } = useAuth();
  const qc = useQueryClient();
  const q = useListingPages({ mine: true });
  const del = useDeleteListing();
  const [editing, setEditing] = useState<Listing | "new" | null>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [saved, setSaved] = useState<LastSaved | null>(() => readLastSaved(userId));

  useEffect(() => { if (new URLSearchParams(window.location.search).get("new")) setEditing("new"); }, []);
  useEffect(() => { setSaved(readLastSaved(userId)); }, [userId]);
  // Refresh the draft card whenever the wizard closes.
  useEffect(() => {
    if (editing || !userId) return;
    let c = false;
    getItem<ListingDraft>(scopedKey(userId, "draft", "new")).then((d) => { if (!c) setDraft(d ?? null); }).catch(() => { if (!c) setDraft(null); });
    return () => { c = true; };
  }, [editing, userId]);

  const onSaved = (l: Listing, kind: "new" | "edit", note?: string) => {
    const v = { id: l.id, title: l.title, kind, at: Date.now() };
    writeLastSaved(userId, v); setSaved(v); setEditing(null);
    if (note) toast({ title: note });
  };
  const dismissSaved = () => { writeLastSaved(userId, null); setSaved(null); };
  const when = (ms: number) => new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));

  return (
    <div>
      <PageHeader kicker={t("tagline")} title={t("wardrobe")} action={
        <Button className="h-11 rounded-full" onClick={() => setEditing("new")} data-testid="button-new-listing"><Plus className="mr-1 h-4 w-4" />{draft ? t("draftResume") : t("addDress")}</Button>
      } />
      <Link href="/how-it-works?lesson=listing" className="mx-4 mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4" data-testid="link-wardrobe-how">
        <PlayCircle className="h-4 w-4" />{t("howItWorks")}
      </Link>

      {saved && (
        <section className="mx-4 mb-3 flex gap-3 rounded-2xl bg-primary p-4 text-primary-foreground rise" role="status" data-testid="panel-saved">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{saved.kind === "new" ? t("svPublished") : t("svUpdated")}</p>
            <p className="text-sm opacity-90">{fmt(t(saved.kind === "new" ? "svPublishedSub" : "svUpdatedSub"), { title: saved.title })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/dress/${saved.id}`} className="inline-flex min-h-10 items-center rounded-full bg-card px-4 text-sm font-semibold text-primary" data-testid="link-saved-view">{t("svView")}</Link>
              <Link href="/discover" className="inline-flex min-h-10 items-center rounded-full border border-primary-foreground/40 px-4 text-sm font-semibold" data-testid="link-saved-find">{t("svFind")}</Link>
            </div>
          </div>
          <button type="button" onClick={dismissSaved} aria-label={t("close")} className="-m-1 grid h-10 w-10 shrink-0 place-items-center rounded-full" data-testid="button-saved-dismiss"><X className="h-4 w-4" /></button>
        </section>
      )}

      {draft && (
        <button type="button" onClick={() => setEditing("new")} className="mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border-2 border-dashed border-accent bg-card p-4 text-left" data-testid="card-draft">
          <HardDrive className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("draftCardTitle")}</span>
            <span className="block truncate font-semibold">{draft.fields.title.trim() || t("untitled")}</span>
            <span className="block text-xs text-muted-foreground">{draft.submission ? t("inDoubtTitle") : t("draftCardSub")} · {when(draft.updatedAt)}</span>
          </span>
          <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">{t("draftResume")}</span>
        </button>
      )}

      {q.isLoading ? <GridSkeleton n={4} /> : q.error ? <ErrorState onRetry={() => q.refetch()} /> : !q.data?.length ? (
        <EmptyState title={t("wardrobeEmpty")} sub={t("emWardrobeFiltered")} action={<Button className="h-11" onClick={() => setEditing("new")} data-testid="button-empty-add">{draft ? t("draftResume") : t("addDress")}</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-4">
          {q.data.map((l, i) => (
            <div key={l.id}>
              <ListingCard l={l} index={i} />
              <div className="mt-1 flex items-center justify-between">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold" data-testid={`status-listing-${l.id}`}>{e(l.status)}</span>
                <div className="flex">
                  <button type="button" onClick={() => setEditing(l)} aria-label={`${t("edit")} ${l.title}`} className="grid h-11 w-11 place-items-center rounded-full text-primary" data-testid={`button-edit-${l.id}`}><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleting(l)} aria-label={`${t("delete")} ${l.title}`} className="grid h-11 w-11 place-items-center rounded-full text-destructive" data-testid={`button-delete-${l.id}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MoreButton q={q} />
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">{editing === "new" ? t("newListing") : t("editListing")}</DialogTitle>
            <DialogDescription className="sr-only">{t("draftCardSub")}</DialogDescription>
          </DialogHeader>
          {editing && <ListingWizard key={editing === "new" ? "new" : editing.id} listing={editing === "new" ? undefined : editing} onSaved={onSaved} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle className="font-display">{t("confirmDelete")}</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete"
              onClick={() => deleting && del.mutate({ id: deleting.id }, {
                onSuccess: () => { qc.invalidateQueries({ queryKey: getGetListingsQueryKey() }); if (saved?.id === deleting.id) dismissSaved(); toast({ title: t("saved") }); },
                onError: (err) => toast({ title: errMsg(err, t("error")), variant: "destructive" }),
              })}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
