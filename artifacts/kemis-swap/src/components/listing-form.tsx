import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateListing, useUpdateListing, useRequestUpload, getGetListingsQueryKey, getGetListingQueryKey,
  type Listing, type ListingInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { CONDITIONS, MEASURE_KEYS, OCCASIONS, compressImage, errMsg, photoSrc } from "@/lib/kemis";

const num = (min: number, max: number) => z.coerce.number().min(min).max(max);
const schema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  condition: z.enum(CONDITIONS as [string, ...string[]]),
  color: z.string().trim().min(1).max(40),
  fabric: z.string().trim().min(1).max(60),
  embroidery: z.string().trim().min(1).max(120),
  occasion: z.enum(OCCASIONS as [string, ...string[]]),
  timesWorn: num(0, 1000).int(),
  bust: num(20, 250), waist: num(20, 250), hips: num(20, 250), shoulder: num(10, 100), length: num(30, 250), sleeves: num(0, 120),
});
type F = z.input<typeof schema>;

export function ListingForm({ listing, onDone }: { listing?: Listing; onDone: () => void }) {
  const { t, e } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const create = useCreateListing();
  const update = useUpdateListing();
  const reqUpload = useRequestUpload();
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [busy, setBusy] = useState(0);
  const [photoErr, setPhotoErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const m = listing?.measurements;
  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: listing?.title ?? "", description: listing?.description ?? "", condition: listing?.condition ?? "Excellent",
      color: listing?.color ?? "", fabric: listing?.fabric ?? "Shemma cotton", embroidery: listing?.embroidery ?? "",
      occasion: listing?.occasion ?? "Timket", timesWorn: listing?.timesWorn ?? 1,
      bust: m?.bust ?? "", waist: m?.waist ?? "", hips: m?.hips ?? "", shoulder: m?.shoulder ?? "", length: m?.length ?? "", sleeves: m?.sleeves ?? "",
    } as F,
  });
  const errs = form.formState.errors;

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, 6 - photos.length);
    for (const file of list) {
      setBusy((b) => b + 1);
      try {
        const blob = await compressImage(file);
        const name = file.name.replace(/\.[^.]+$/, "").slice(0, 180) + ".webp";
        const { uploadURL, objectPath } = await reqUpload.mutateAsync({ data: { name, size: blob.size, contentType: "image/webp" } });
        const res = await fetch(uploadURL, { method: "PUT", body: blob, headers: { "Content-Type": "image/webp" } });
        if (!res.ok) throw new Error("upload failed");
        setPhotos((p) => [...p, objectPath].slice(0, 6));
        setPhotoErr(false);
      } catch (err) {
        toast({ title: errMsg(err, t("error")), variant: "destructive" });
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const submit = form.handleSubmit((raw) => {
    if (photos.length < 1) { setPhotoErr(true); return; }
    const v = schema.parse(raw);
    const data: ListingInput = {
      title: v.title, description: v.description, photos, condition: v.condition as ListingInput["condition"],
      color: v.color, fabric: v.fabric, embroidery: v.embroidery, occasion: v.occasion as ListingInput["occasion"], timesWorn: v.timesWorn,
      measurements: { bust: v.bust, waist: v.waist, hips: v.hips, shoulder: v.shoulder, length: v.length, sleeves: v.sleeves },
    };
    const opts = {
      onSuccess: (l: Listing) => {
        qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        qc.setQueryData(getGetListingQueryKey(l.id), l);
        toast({ title: t("saved") });
        onDone();
      },
      onError: (err: unknown) => toast({ title: errMsg(err, t("error")), variant: "destructive" }),
    };
    if (listing) update.mutate({ id: listing.id, data }, opts);
    else create.mutate({ data }, opts);
  });

  const pending = create.isPending || update.isPending;
  const field = (k: keyof F, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`lf-${k}`}>{label}</Label>
      <Input id={`lf-${k}`} {...form.register(k)} className="h-11 bg-background" data-testid={`input-${k}`} {...props} />
      {errs[k] && <p className="text-xs text-destructive">{t("required")}</p>}
    </div>
  );
  const select = (k: "condition" | "occasion", opts: string[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={`lf-${k}`}>{t(k)}</Label>
      <select id={`lf-${k}`} {...form.register(k)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid={`select-${k}`}>
        {opts.map((o) => <option key={o} value={o}>{e(o)}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <p className="rounded-xl bg-secondary p-3 text-xs font-medium text-secondary-foreground tibeb-edge">{t("onlyKemis")}</p>
      <div>
        <Label>{t("photos")}</Label>
        <p className="mb-2 text-xs text-muted-foreground">{t("photoLimit")}</p>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p + i} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
              <img src={photoSrc(p)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} aria-label={`${t("delete")} ${i + 1}`} data-testid={`button-remove-photo-${i}`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-foreground/70 text-background"><X className="h-4 w-4" /></button>
            </div>
          ))}
          {Array.from({ length: busy }).map((_, i) => (
            <div key={`b${i}`} className="grid aspect-[3/4] place-items-center rounded-xl bg-secondary text-xs text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ))}
          {photos.length + busy < 6 && (
            <button type="button" onClick={() => fileRef.current?.click()} data-testid="button-add-photo"
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-accent bg-card text-xs font-semibold text-primary">
              <ImagePlus className="h-6 w-6" />{t("addPhoto")}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(ev) => addFiles(ev.target.files)} data-testid="input-photo-file" />
        {photoErr && <p className="mt-1 text-xs text-destructive">{t("required")}</p>}
      </div>
      {field("title", t("title"), { placeholder: "Ivory kemis with emerald tibeb" })}
      <div className="space-y-1.5">
        <Label htmlFor="lf-description">{t("description")}</Label>
        <Textarea id="lf-description" rows={4} {...form.register("description")} className="bg-background" data-testid="input-description" />
        {errs.description && <p className="text-xs text-destructive">{t("required")}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {select("occasion", OCCASIONS)}
        {select("condition", CONDITIONS)}
        {field("color", t("color"))}
        {field("fabric", t("fabric"))}
      </div>
      {field("embroidery", t("embroidery"), { placeholder: "Green and gold meskel cross tibeb" })}
      {field("timesWorn", t("timesWorn"), { inputMode: "numeric" })}
      <fieldset className="rounded-2xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-primary">{t("measurements")} ({t("cm")})</legend>
        <div className="grid grid-cols-3 gap-2">
          {MEASURE_KEYS.map((k) => (
            <div key={k}>
              <Label htmlFor={`lf-${k}`} className="text-xs">{t(k)}</Label>
              <Input id={`lf-${k}`} inputMode="decimal" {...form.register(k)} className="h-11 bg-background" data-testid={`input-${k}`} />
              {errs[k] && <p className="text-[10px] text-destructive">{t("required")}</p>}
            </div>
          ))}
        </div>
      </fieldset>
      <div className="sticky bottom-0 -mx-1 flex gap-2 bg-card px-1 pb-1 pt-2">
        <Button type="button" variant="outline" className="h-12 flex-1" onClick={onDone}>{t("cancel")}</Button>
        <Button type="submit" className="h-12 flex-[2]" disabled={pending || busy > 0} data-testid="button-save-listing">{pending ? t("loading") : t("save")}</Button>
      </div>
    </form>
  );
}
