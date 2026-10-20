import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteListing, useGetListings, getGetListingsQueryKey, type Listing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, GridSkeleton, ListingCard, PageHeader } from "@/components/kit";
import { useListingPages } from "@/lib/paged-queries";
import { MoreButton } from "@/components/more-button";
import { ListingForm } from "@/components/listing-form";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { errMsg } from "@/lib/kemis";

export default function Wardrobe() {
  const { t, e } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useListingPages({mine:true});
  const del = useDeleteListing();
  const [editing, setEditing] = useState<Listing | "new" | null>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);

  useEffect(() => { if (new URLSearchParams(window.location.search).get("new")) setEditing("new"); }, []);

  return (
    <div>
      <PageHeader kicker={t("tagline")} title={t("wardrobe")} action={
        <Button className="h-11 rounded-full" onClick={() => setEditing("new")} data-testid="button-new-listing"><Plus className="mr-1 h-4 w-4" />{t("addDress")}</Button>
      } />
      {q.isLoading ? <GridSkeleton n={4} /> : q.error ? <ErrorState onRetry={() => q.refetch()} /> : !q.data?.length ? (
        <EmptyState title={t("wardrobeEmpty")} sub={t("wardrobeEmptySub")} action={<Button onClick={() => setEditing("new")} data-testid="button-empty-add">{t("addDress")}</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-4">
          {q.data.map((l, i) => (
            <div key={l.id}>
              <ListingCard l={l} index={i} />
              <div className="mt-1 flex items-center justify-between">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold" data-testid={`status-listing-${l.id}`}>{e(l.status)}</span>
                <div className="flex">
                  <button type="button" onClick={() => setEditing(l)} aria-label={`${t("edit")} ${l.title}`} className="grid h-10 w-10 place-items-center rounded-full text-primary" data-testid={`button-edit-${l.id}`}><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleting(l)} aria-label={`${t("delete")} ${l.title}`} className="grid h-10 w-10 place-items-center rounded-full text-destructive" data-testid={`button-delete-${l.id}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MoreButton q={q} />
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto bg-card">
          <DialogHeader><DialogTitle className="font-display text-2xl text-primary">{editing === "new" ? t("newListing") : t("editListing")}</DialogTitle></DialogHeader>
          {editing && <ListingForm key={editing === "new" ? "new" : editing.id} listing={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle className="font-display">{t("confirmDelete")}</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete"
              onClick={() => deleting && del.mutate({ id: deleting.id }, {
                onSuccess: () => { qc.invalidateQueries({ queryKey: getGetListingsQueryKey() }); toast({ title: t("saved") }); },
                onError: (err) => toast({ title: errMsg(err, t("error")), variant: "destructive" }),
              })}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
