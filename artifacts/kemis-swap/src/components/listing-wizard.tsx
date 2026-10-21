import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, HardDrive, ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { useCreateListing, useUpdateListing, useRequestUpload, getListing, type Listing, type ListingInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MeasureDiagram, useMeasureHelp } from "@/components/measure-help";
import { useI18n } from "@/lib/i18n";
import { fmt } from "@/lib/i18n-extra";
import { CONDITIONS, MEASURE_KEYS, OCCASIONS, compressImage, errMsg } from "@/lib/kemis";
import { SmartImg } from "@/lib/low-data";
import { useOnline } from "@/lib/online";
import { applySavedListing } from "@/lib/listing-cache";
import { delItem, getItem, newRequestId, scopedKey, setItem } from "@/lib/device-store";
import {
  DETAIL_ORDER, emptyFields, fieldsFrom, firstInvalidStep, shouldDeleteAfterSave, toPayload, validateStep,
  type DraftFields, type FieldErr, type ListingDraft, type PendingPhoto, type StepErrors,
} from "@/lib/listing-draft";
import { cn } from "@/lib/utils";

type Props = { listing?: Listing; onSaved: (l: Listing, kind: "new" | "edit", note?: string) => void; onClose: () => void };
const OPTS = { conditions: CONDITIONS as string[], occasions: OCCASIONS as string[] };
type MK = typeof MEASURE_KEYS[number];

export function ListingWizard(props: Props) {
  const { userId, isLoaded } = useAuth();
  if (!isLoaded || !userId) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  // Remount on account change so one person's draft can never render for another.
  return <Wizard key={userId} uid={userId} {...props} />;
}

function Wizard({ uid, listing, onSaved, onClose }: Props & { uid: string }) {
  const { t, e, lang } = useI18n();
  const qc = useQueryClient();
  const online = useOnline();
  const create = useCreateListing();
  const updateM = useUpdateListing();
  const reqUpload = useRequestUpload();
  const help = useMeasureHelp("listing");
  const key = listing ? scopedKey(uid, "draft", "edit", listing.id) : scopedKey(uid, "draft", "new");

  const [phase, setPhase] = useState<"loading" | "restore" | "editing">("loading");
  const [offer, setOffer] = useState<ListingDraft | null>(null);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [errors, setErrors] = useState<StepErrors>({});
  const [persist, setPersist] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [focusK, setFocusK] = useState<MK>("bust");
  const fileRef = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const dirty = useRef(false);
  const closed = useRef(false);
  const latest = useRef<ListingDraft | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const urls = useRef(new Map<string, string>());
  const onSavedRef = useRef(onSaved); onSavedRef.current = onSaved;

  const fresh = useCallback((): ListingDraft => listing
    ? { v: 1, kind: "edit", listingId: listing.id, step: 0, fields: fieldsFrom(listing), photos: [...listing.photos], pending: [], updatedAt: Date.now() }
    : { v: 1, kind: "new", requestId: newRequestId(), step: 0, fields: emptyFields(t("defaultFabric")), photos: [], pending: [], updatedAt: Date.now() },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [listing?.id]);

  const persistNow = useCallback((d: ListingDraft) => {
    queue.current = queue.current.then(async () => {
      if (closed.current) return;
      setPersist("saving");
      try { await setItem(key, d); if (!closed.current) { setPersist("saved"); setSavedAt(Date.now()); } }
      catch { setPersist("failed"); }
    });
    return queue.current;
  }, [key]);

  /** Delete the stored draft only if it is still the one we submitted. */
  const finish = useCallback(async (requestId: string | undefined, submittedAt: number) => {
    closed.current = true;
    await queue.current.catch(() => undefined);
    try {
      const stored = await getItem<ListingDraft>(key);
      if (shouldDeleteAfterSave(stored, requestId, submittedAt)) await delItem(key);
    } catch { /* draft stays; harmless */ }
  }, [key]);

  // Load once. Never write before hydration, so mount cannot overwrite a saved draft.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let s: ListingDraft | undefined;
      try { s = await getItem<ListingDraft>(key); } catch { setPersist("failed"); }
      if (cancelled) return;
      if (s && s.v === 1) {
        s = { ...s, pending: s.pending.map((p) => ({ ...p, status: "failed" as const })), submission: s.submission && { ...s.submission, state: "unknown" } };
        if (s.submission && s.requestId) {
          try {
            const l = await getListing(s.requestId);
            if (cancelled) return;
            applySavedListing(qc, l);
            await finish(s.requestId, Date.now());
            onSavedRef.current(l, "new");
            return;
          } catch { /* not created yet: keep in-doubt draft */ }
        }
        if (cancelled) return;
        setOffer(s); setPhase("restore");
      } else { const f = fresh(); latest.current = f; setDraft(f); setPhase("editing"); }
    })();
    return () => { cancelled = true; };
  }, [key, fresh, finish, qc]);

  // Debounced autosave after real edits only.
  useEffect(() => {
    if (phase !== "editing" || !draft || !dirty.current) return;
    const id = setTimeout(() => { void persistNow(draft); }, 400);
    return () => clearTimeout(id);
  }, [draft, phase, persistNow]);

  // Flush on hide/unmount (async-safe: queue checks `closed`).
  useEffect(() => {
    const flush = () => { if (dirty.current && latest.current && !closed.current) void persistNow(latest.current); };
    const vis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", vis); window.addEventListener("pagehide", flush);
    return () => { document.removeEventListener("visibilitychange", vis); window.removeEventListener("pagehide", flush); flush(); };
  }, [persistNow]);
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const patch = useCallback((fn: (d: ListingDraft) => ListingDraft) => {
    dirty.current = true;
    setDraft((d) => { if (!d) return d; const n = { ...fn(d), updatedAt: Date.now() }; latest.current = n; return n; });
  }, []);
  const setField = (k: keyof Omit<DraftFields, "m">, v: string) => { patch((d) => ({ ...d, fields: { ...d.fields, [k]: v } })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };
  const setM = (k: MK, v: string) => { patch((d) => ({ ...d, fields: { ...d.fields, m: { ...d.fields.m, [k]: v } } })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };

  const urlFor = (p: PendingPhoto) => { let u = urls.current.get(p.id); if (!u) { u = URL.createObjectURL(p.blob); urls.current.set(p.id, u); } return u; };

  async function uploadOne(p: PendingPhoto) {
    patch((d) => ({ ...d, pending: d.pending.map((x) => (x.id === p.id ? { ...x, status: "uploading" } : x)) }));
    try {
      if (!navigator.onLine) throw new Error(t("wzPhotoOfflineWait"));
      const { uploadURL, objectPath } = await reqUpload.mutateAsync({ data: { name: `kemis-${p.id.slice(0, 8)}.webp`, size: p.blob.size, contentType: "image/webp" } });
      const res = await fetch(uploadURL, { method: "PUT", body: p.blob, headers: { "Content-Type": "image/webp" } });
      if (!res.ok) throw new Error(t("wzPhotoFailed"));
      patch((d) => d.pending.some((x) => x.id === p.id) ? { ...d, pending: d.pending.filter((x) => x.id !== p.id), photos: [...d.photos, objectPath].slice(0, 6) } : d);
      setPhotoMsg(null);
    } catch (err) {
      patch((d) => ({ ...d, pending: d.pending.map((x) => (x.id === p.id ? { ...x, status: "failed" } : x)) }));
      setPhotoMsg(navigator.onLine ? errMsg(err, t("wzPhotoFailed")) : t("wzPhotoOfflineWait"));
    }
  }
  async function addFiles(files: FileList | null) {
    if (!files || !draft) return;
    const room = 6 - draft.photos.length - draft.pending.length;
    for (const file of Array.from(files).slice(0, Math.max(0, room))) {
      try {
        const blob = await compressImage(file);
        const p: PendingPhoto = { id: newRequestId(), blob, status: "uploading" };
        patch((d) => ({ ...d, pending: [...d.pending, p] }));
        if (errors.photos) setErrors((x) => ({ ...x, photos: undefined }));
        void uploadOne(p);
      } catch (err) { setPhotoMsg(errMsg(err, t("error"))); }
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  const removePending = (id: string) => { const u = urls.current.get(id); if (u) { URL.revokeObjectURL(u); urls.current.delete(id); } patch((d) => ({ ...d, pending: d.pending.filter((x) => x.id !== id) })); };

  const focusFirst = (errs: StepErrors, step: number) => {
    const order: string[] = step === 0 ? ["photos"] : step === 1 ? [...DETAIL_ORDER] : [...MEASURE_KEYS];
    const k = order.find((x) => errs[x]);
    if (k) requestAnimationFrame(() => document.getElementById(`wz-${k}`)?.focus());
  };
  const goStep = (s: number) => { patch((d) => ({ ...d, step: s })); setErrors({}); setSubmitError(null); requestAnimationFrame(() => { headRef.current?.focus(); headRef.current?.scrollIntoView({ block: "nearest" }); }); };
  const next = () => {
    if (!draft) return;
    const errs = validateStep(draft.step, draft, OPTS);
    if (Object.keys(errs).length) { setErrors(errs); focusFirst(errs, draft.step); return; }
    goStep(draft.step + 1);
  };

  async function discard() {
    closed.current = true;
    await queue.current.catch(() => undefined);
    try { await delItem(key); } catch { /* nothing stored */ }
    urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current.clear();
    dirty.current = false; closed.current = false;
    setConfirmDiscard(false); setOffer(null); setErrors({}); setSubmitError(null); setPersist("idle");
    if (phase === "restore") { const f = fresh(); latest.current = f; setDraft(f); setPhase("editing"); }
    else onClose();
  }

  async function publish() {
    if (!draft) return;
    setSubmitError(null);
    if (!draft.submission) {
      const bad = firstInvalidStep(draft, OPTS);
      if (bad >= 0) { const errs = validateStep(bad, draft, OPTS); goStep(bad); setErrors(errs); focusFirst(errs, bad); return; }
    }
    if (draft.kind === "edit") {
      const at = Date.now();
      await persistNow(draft);
      updateM.mutate({ id: draft.listingId!, data: toPayload(draft) as ListingInput }, {
        onSuccess: async (l) => { applySavedListing(qc, l); await finish(undefined, at); onSaved(l, "edit"); },
        onError: (err) => setSubmitError(`${t("saveEditFailed")} ${errMsg(err, "")}`.trim()),
      });
      return;
    }
    const payload = draft.submission?.payload ?? toPayload(draft);
    const reqId = draft.requestId!;
    const sending: ListingDraft = { ...draft, submission: { payload, state: "sending" } };
    dirty.current = true; latest.current = sending; setDraft(sending);
    await persistNow(sending);
    // Stable identity: same UUID and the exact same payload on every retry.
    create.mutate({ data: { ...payload, clientRequestId: reqId } as ListingInput }, {
      onSuccess: async (l) => { applySavedListing(qc, l); await finish(reqId, Date.now()); onSaved(l, "new"); },
      onError: async (err) => {
        const st = (err as { status?: number } | null)?.status;
        if (st === 409) {
          try { const l = await getListing(reqId); applySavedListing(qc, l); await finish(reqId, Date.now()); onSaved(l, "new", t("publishedEarlier")); return; } catch { /* fall through */ }
        }
        const definite = typeof st === "number" && st >= 400 && st < 500 && st !== 408 && st !== 409 && st !== 429;
        const nd: ListingDraft = { ...sending, submission: definite ? undefined : { payload, state: "unknown" } };
        latest.current = nd; setDraft(nd); void persistNow(nd);
        setSubmitError(`${t("publishFailed")} ${errMsg(err, "")}`.trim());
      },
    });
  }

  const errText = (x?: FieldErr) => {
    if (!x) return null;
    switch (x.code) {
      case "tooShort": return fmt(t("errTooShort"), { n: x.n ?? 0 });
      case "tooLong": return fmt(t("errTooLong"), { n: x.n ?? 0 });
      case "number": return t("errNumber");
      case "whole": return t("errWhole");
      case "range": return fmt(t("errRange"), { min: x.min ?? 0, max: x.max ?? 0 });
      case "photos": return t("errPhotos");
      case "uploading": return t("errUploading");
      default: return t("errRequired");
    }
  };
  const when = (ms: number) => new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));

  if (phase === "loading" || (phase === "editing" && !draft)) return <div className="space-y-3" aria-busy="true"><div className="h-6 w-1/2 animate-pulse rounded bg-secondary" /><div className="h-48 animate-pulse rounded-2xl bg-secondary" /></div>;

  if (phase === "restore" && offer) {
    return (
      <div className="space-y-4" data-testid="panel-draft-restore">
        <div className="overflow-hidden rounded-2xl border border-accent bg-background">
          <div className="tibeb-thin" aria-hidden />
          <div className="space-y-2 p-4">
            <p className="flex items-center gap-2 font-semibold text-primary"><HardDrive className="h-4 w-4" aria-hidden />{offer.kind === "edit" ? t("draftEditFound") : t("draftFound")}</p>
            <p className="text-sm text-muted-foreground">{fmt(t("draftFoundSub"), { time: when(offer.updatedAt) })}</p>
            <p className="text-sm font-medium">{offer.fields.title.trim() || t("untitled")}</p>
            {offer.submission && <p className="rounded-xl bg-secondary p-3 text-sm" role="status"><strong>{t("inDoubtTitle")}.</strong> {t("inDoubtSub")}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="h-12 flex-1" onClick={() => { latest.current = offer; setDraft(offer); setPhase("editing"); setPersist("saved"); setSavedAt(offer.updatedAt); }} data-testid="button-draft-resume">{t("draftResume")}</Button>
          <Button variant="outline" className="h-12 flex-1 text-destructive" onClick={() => setConfirmDiscard(true)} data-testid="button-draft-discard">{t("draftDiscard")}</Button>
        </div>
        {discardDialog()}
      </div>
    );
  }

  const d = draft!;
  const steps = [t("wzStepPhotos"), t("wzStepDetails"), t("wzStepMeasure"), t("wzStepReview")];
  const pending = create.isPending || updateM.isPending;
  const inDoubt = !!d.submission;
  const step = inDoubt ? 3 : d.step;
  const review = d.submission?.payload ?? toPayload(d);

  function discardDialog() {
    return (
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader><AlertDialogTitle className="font-display">{t("draftDiscard")}?</AlertDialogTitle><AlertDialogDescription>{t("draftDiscardConfirm")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("back")}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => void discard()} data-testid="button-confirm-discard">{t("draftDiscard")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const errP = (k: string) => errors[k] ? <p id={`wz-${k}-err`} className="text-xs font-medium text-destructive">{errText(errors[k])}</p> : null;
  const aria = (k: string) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `wz-${k}-err` : undefined });
  const field = (k: "title" | "color" | "fabric" | "embroidery" | "timesWorn", label: string, extra: Record<string, unknown> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`wz-${k}`}>{label}</Label>
      <Input id={`wz-${k}`} value={d.fields[k]} onChange={(ev) => setField(k, ev.target.value)} className={cn("h-11 bg-background", errors[k] && "border-destructive")} data-testid={`input-${k}`} {...aria(k)} {...extra} />
      {errP(k)}
    </div>
  );
  const select = (k: "occasion" | "condition", opts: string[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={`wz-${k}`}>{t(k)}</Label>
      <select id={`wz-${k}`} value={d.fields[k]} onChange={(ev) => setField(k, ev.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid={`select-${k}`} {...aria(k)}>
        {opts.map((o) => <option key={o} value={o}>{e(o)}</option>)}
      </select>
      {errP(k)}
    </div>
  );
  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex justify-between gap-3 border-t border-border py-2 text-sm first:border-t-0"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{children}</dd></div>
  );
  const SectionHead = ({ title, to }: { title: string; to: number }) => (
    <div className="mb-1 flex items-center justify-between">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {!inDoubt && <button type="button" onClick={() => goStep(to)} className="min-h-10 px-2 text-sm font-semibold text-primary underline underline-offset-4" data-testid={`button-review-edit-${to}`}>{t("edit")}</button>}
    </div>
  );

  return (
    <div className="space-y-5" data-testid="listing-wizard">
      <nav aria-label={t("newListing")}>
        <ol className="grid grid-cols-4 gap-1.5">
          {steps.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined} className="min-w-0">
              <div className={cn("h-1.5 rounded-full", i < step ? "bg-primary" : i === step ? "bg-accent" : "bg-secondary")} />
              <p className={cn("mt-1 truncate text-[11px]", i === step ? "font-semibold text-primary" : "text-muted-foreground")}>
                {i < step && <Check className="mr-0.5 inline h-3 w-3" aria-hidden />}{s}
              </p>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 ref={headRef} tabIndex={-1} className="font-display text-xl font-semibold text-primary outline-none" data-testid="text-wizard-step">
          <span className="sr-only">{t("wzStep")} {step + 1} {t("wzOf")} 4: </span>{steps[step]}
        </h3>
        <span className="rounded-full border border-dashed border-primary/50 px-2 py-0.5 text-[11px] font-semibold text-primary" data-testid="badge-draft">{d.kind === "edit" ? t("editListing") : t("draftNotPublished")}</span>
      </div>
      <p className={cn("flex items-center gap-1.5 text-xs", persist === "failed" ? "font-medium text-destructive" : "text-muted-foreground")} role="status" aria-live="polite" data-testid="status-draft-save">
        {persist === "failed" ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <HardDrive className="h-3.5 w-3.5" aria-hidden />}
        {persist === "failed" ? t("draftFailed") : persist === "saving" ? t("draftSaving") : persist === "saved" && savedAt ? `${t("draftSaved")} · ${new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { timeStyle: "short" }).format(new Date(savedAt))}` : t("draftNotPublished")}
      </p>

      {Object.values(errors).some(Boolean) && <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert" data-testid="text-step-errors">{t("wzFixErrors")}</p>}

      {step === 0 && (
        <div className="space-y-3">
          <p className="rounded-xl bg-secondary p-3 text-xs font-medium text-secondary-foreground tibeb-edge">{t("onlyKemis")}</p>
          <p className="text-xs text-muted-foreground">{t("photoLimit")}</p>
          <div className="grid grid-cols-3 gap-2">
            {d.photos.map((p, i) => (
              <div key={p + i} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
                <SmartImg path={p} alt={`${t("photos")} ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{t("wzCover")}</span>}
                <button type="button" onClick={() => patch((x) => ({ ...x, photos: x.photos.filter((_, j) => j !== i) }))} aria-label={`${t("wzPhotoRemove")} ${i + 1}`} data-testid={`button-remove-photo-${i}`}
                  className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-foreground/75 text-background"><X className="h-4 w-4" /></button>
              </div>
            ))}
            {d.pending.map((p) => (
              <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary" data-testid={`pending-photo-${p.id}`}>
                <img src={urlFor(p)} alt="" className={cn("h-full w-full object-cover", p.status === "failed" && "opacity-50")} />
                <div className="absolute inset-x-1 bottom-1 rounded-lg bg-card/95 p-1 text-center text-[10px] font-semibold" role="status">
                  {p.status === "uploading" ? <span className="inline-flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden />{t("wzPhotoUploading")}</span>
                    : <span className="text-destructive">{t("wzPhotoFailed")}</span>}
                </div>
                {p.status === "failed" && (
                  <div className="absolute inset-x-1 top-1 flex justify-between">
                    <button type="button" onClick={() => void uploadOne(p)} aria-label={t("wzPhotoRetry")} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground" data-testid={`button-retry-photo-${p.id}`}><RotateCcw className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removePending(p.id)} aria-label={t("wzPhotoRemove")} className="grid h-9 w-9 place-items-center rounded-full bg-foreground/75 text-background" data-testid={`button-remove-pending-${p.id}`}><X className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            ))}
            {d.photos.length + d.pending.length < 6 && (
              <button id="wz-photos" type="button" onClick={() => fileRef.current?.click()} data-testid="button-add-photo" {...aria("photos")}
                className={cn("flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-card text-xs font-semibold text-primary", errors.photos ? "border-destructive" : "border-accent")}>
                <ImagePlus className="h-6 w-6" />{t("addPhoto")}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(ev) => void addFiles(ev.target.files)} data-testid="input-photo-file" />
          {errP("photos")}
          {d.pending.length > 0 && <p className="text-xs text-muted-foreground">{t("wzPhotoLocal")}</p>}
          {photoMsg && <p className="text-xs font-medium text-destructive" role="alert" data-testid="text-photo-error">{photoMsg}</p>}
          {!online && <p className="text-xs text-muted-foreground">{t("offlineLong")}</p>}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {field("title", t("title"), { placeholder: t("exampleTitle"), maxLength: 100 })}
          <div className="space-y-1.5">
            <Label htmlFor="wz-description">{t("description")}</Label>
            <Textarea id="wz-description" rows={4} maxLength={2000} value={d.fields.description} onChange={(ev) => setField("description", ev.target.value)} className={cn("bg-background", errors.description && "border-destructive")} data-testid="input-description" {...aria("description")} />
            {errP("description")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {select("occasion", OCCASIONS)}
            {select("condition", CONDITIONS)}
            {field("color", t("color"), { maxLength: 40 })}
            {field("fabric", t("fabric"), { maxLength: 60 })}
          </div>
          {field("embroidery", t("embroidery"), { placeholder: t("exampleEmbroidery"), maxLength: 120 })}
          {field("timesWorn", t("timesWorn"), { inputMode: "numeric" })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-background p-3">
            <MeasureDiagram k={focusK} className="h-28 w-20 shrink-0" />
            <div className="space-y-2 text-sm">
              <p>{t("garmentMeasureNote")}</p>
              {help.guideButton()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MEASURE_KEYS.map((k) => (
              <div key={k} className="space-y-1">
                <div className="flex items-center justify-between"><Label htmlFor={`wz-${k}`} className="text-sm">{t(k)} ({t("cm")})</Label>{help.fieldHelp(k)}</div>
                <Input id={`wz-${k}`} inputMode="decimal" value={d.fields.m[k]} onFocus={() => setFocusK(k)} onChange={(ev) => setM(k, ev.target.value)} className={cn("h-11 bg-background", errors[k] && "border-destructive")} data-testid={`input-${k}`} {...aria(k)} />
                {errP(k)}
              </div>
            ))}
          </div>
          {help.dialog}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4" data-testid="panel-review">
          {inDoubt && (
            <div className="rounded-2xl border border-accent bg-secondary p-4 text-sm" role="status" data-testid="panel-in-doubt">
              <p className="font-semibold text-primary">{t("inDoubtTitle")}</p><p className="mt-1">{t("inDoubtSub")}</p>
            </div>
          )}
          {!inDoubt && <p className="text-sm text-muted-foreground">{t("reviewTitle")}</p>}
          <section>
            <SectionHead title={t("wzStepPhotos")} to={0} />
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {review.photos.map((p, i) => <SmartImg key={p + i} path={p} alt={`${t("photos")} ${i + 1}`} className="h-28 w-20 shrink-0 rounded-xl object-cover" />)}
            </div>
          </section>
          <section>
            <SectionHead title={t("wzStepDetails")} to={1} />
            <dl className="rounded-2xl bg-background px-3">
              <Row label={t("title")}><span data-testid="text-review-title">{review.title}</span></Row>
              <Row label={t("description")}><span className="block whitespace-pre-line text-left font-normal">{review.description}</span></Row>
              <Row label={t("occasion")}>{e(review.occasion)}</Row>
              <Row label={t("condition")}>{e(review.condition)}</Row>
              <Row label={t("color")}>{review.color}</Row>
              <Row label={t("fabric")}>{review.fabric}</Row>
              <Row label={t("embroidery")}>{review.embroidery}</Row>
              <Row label={t("timesWorn")}>{review.timesWorn}</Row>
            </dl>
          </section>
          <section>
            <SectionHead title={t("wzStepMeasure")} to={2} />
            <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border">
              {MEASURE_KEYS.map((k, i) => (
                <div key={k} className={cn("bg-background p-2.5", i % 3 !== 2 && "border-r", i < 3 && "border-b")}>
                  <dt className="text-[11px] text-muted-foreground">{t(k)}</dt>
                  <dd className="font-display text-lg font-semibold text-primary" data-testid={`text-review-${k}`}>{review.measurements[k]}<span className="ml-0.5 text-xs font-normal text-muted-foreground">{t("cm")}</span></dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">{t("reviewNote")}</p>
          </section>
        </div>
      )}

      {submitError && <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert" data-testid="text-submit-error">{submitError}</p>}

      <div className="sticky bottom-0 -mx-1 space-y-2 bg-card px-1 pb-1 pt-2">
        <div className="flex gap-2">
          {step === 0 || inDoubt
            ? <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose} data-testid="button-wizard-close">{t("close")}</Button>
            : <Button type="button" variant="outline" className="h-12 flex-1" onClick={() => goStep(step - 1)} disabled={pending} data-testid="button-wizard-back">{t("back")}</Button>}
          {step < 3
            ? <Button type="button" className="h-12 flex-[2]" onClick={next} data-testid="button-wizard-next">{t("wzNext")}</Button>
            : <Button type="button" className="h-12 flex-[2]" onClick={() => void publish()} disabled={pending || d.pending.length > 0} data-testid="button-save-listing">
                {pending ? (d.kind === "edit" ? t("wzSaving") : t("wzPublishing")) : inDoubt ? t("inDoubtRetry") : d.kind === "edit" ? t("wzSaveChanges") : t("wzPublish")}
              </Button>}
        </div>
        <button type="button" onClick={() => setConfirmDiscard(true)} disabled={pending} className="min-h-10 w-full text-center text-sm font-medium text-destructive underline-offset-4 hover:underline" data-testid="button-discard-draft">{t("draftDiscard")}</button>
      </div>
      {discardDialog()}
    </div>
  );
}
