import { useState } from "react";
import { Ban, Flag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlockUser, useCreateReport, getGetListingsQueryKey, getGetMatchesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { errMsg } from "@/lib/kemis";

export function SafetyActions({ listingId, userId, onBlocked }: { listingId: string; userId: string; onBlocked?: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState("");
  const report = useCreateReport();
  const block = useBlockUser();

  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)} data-testid="button-report">
        <Flag className="mr-1 h-4 w-4" />{t("report")}
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setBlockOpen(true)} data-testid="button-block">
        <Ban className="mr-1 h-4 w-4" />{t("block")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle className="font-display">{t("reportReason")}</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={1000} className="bg-background" data-testid="input-report-reason" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button disabled={reason.trim().length < 5 || report.isPending} data-testid="button-submit-report"
              onClick={() => report.mutate({ data: { listingId, reason: reason.trim() } }, {
                onSuccess: () => { toast({ title: t("reportSent") }); setOpen(false); setReason(""); },
                onError: (e) => toast({ title: errMsg(e, t("error")), variant: "destructive" }),
              })}>{t("send")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle className="font-display">{t("block")}?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" data-testid="button-confirm-block"
              onClick={() => block.mutate({ data: { userId } }, {
                onSuccess: () => {
                  toast({ title: t("blocked") });
                  qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
                  qc.invalidateQueries({ queryKey: getGetMatchesQueryKey() });
                  onBlocked?.();
                },
                onError: (e) => toast({ title: errMsg(e, t("error")), variant: "destructive" }),
              })}>{t("block")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
