import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useSaveProfile, getGetProfileQueryKey, getGetListingsQueryKey, type Profile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { MEASURE_KEYS, errMsg } from "@/lib/kemis";

const opt = (min: number, max: number) => z.union([z.literal(""), z.coerce.number().min(min).max(max)]);
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  neighborhood: z.string().trim().min(1).max(80),
  bust: opt(20,250), waist: opt(20,250), hips: opt(20,250),
  shoulder: opt(10,100), length: opt(30,250), sleeves: opt(0,120),
}).superRefine((v,ctx)=>{
  if(MEASURE_KEYS.some(k=>v[k]!=="") && MEASURE_KEYS.some(k=>v[k]==="")) {
    for(const k of MEASURE_KEYS) if(v[k]==="") ctx.addIssue({code:"custom",path:[k],message:"Complete all measurements or leave them all blank"});
  }
});
type F = z.input<typeof schema>;

export function ProfileForm({ profile, onDone }: { profile?: Profile | null; onDone?: () => void }) {
  const { t, lang, setLang } = useI18n();
  const qc = useQueryClient();
  const { toast } = useToast();
  const save = useSaveProfile();
  const m = profile?.measurements;
  const form = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.name ?? "", neighborhood: profile?.neighborhood ?? "",
      bust: m?.bust ?? "", waist: m?.waist ?? "", hips: m?.hips ?? "", shoulder: m?.shoulder ?? "", length: m?.length ?? "", sleeves: m?.sleeves ?? "",
    },
  });
  const errs = form.formState.errors;

  const submit = form.handleSubmit((raw) => {
    const v = schema.parse(raw);
    const vals = MEASURE_KEYS.map((k) => v[k]);
    const full = vals.every((x) => x !== "");
    save.mutate({
      data: {
        name: v.name, neighborhood: v.neighborhood, language: lang,
        measurements: full ? Object.fromEntries(MEASURE_KEYS.map((k) => [k, Number(v[k])])) as unknown as Profile["measurements"] : undefined,
      },
    }, {
      onSuccess: (p) => {
        qc.setQueryData(getGetProfileQueryKey(), p);
        qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        toast({ title: t("saved") });
        onDone?.();
      },
      onError: (e) => toast({ title: errMsg(e, t("error")), variant: "destructive" }),
    });
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("yourName")}</Label>
        <Input id="name" {...form.register("name")} className="h-12 bg-card" autoComplete="given-name" data-testid="input-name" />
        {errs.name && <p className="text-xs text-destructive">{t("required")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hood">{t("neighborhood")}</Label>
        <Input id="hood" {...form.register("neighborhood")} className="h-12 bg-card" placeholder={t("exampleNeighborhood")} data-testid="input-neighborhood" />
        <p className="text-xs text-muted-foreground">{t("generalHood")}</p>
        {errs.neighborhood && <p className="text-xs text-destructive">{t("required")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>{t("language")}</Label>
        <div className="flex gap-2">
          {(["am", "en"] as const).map((l) => (
            <button type="button" key={l} onClick={() => setLang(l)} aria-pressed={lang === l} data-testid={`button-profile-lang-${l}`}
              className={`h-11 flex-1 rounded-xl border text-sm font-semibold ${lang === l ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              {l === "en" ? t("englishLanguage") : t("amharicLanguage")}
            </button>
          ))}
        </div>
      </div>
      <fieldset className="rounded-2xl border border-dashed border-accent p-4">
        <legend className="px-1 text-sm font-semibold text-primary">{t("privateMeasure")}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{t("privateNote")}</p>
        <div className="grid grid-cols-3 gap-2">
          {MEASURE_KEYS.map((k) => (
            <div key={k}>
              <Label htmlFor={`pm-${k}`} className="text-xs">{t(k)} ({t("cm")})</Label>
              <Input id={`pm-${k}`} inputMode="decimal" {...form.register(k)} className="h-11 bg-card" data-testid={`input-my-${k}`} />
               {errs[k] && <p className="text-xs text-destructive">{t("required")}</p>}
            </div>
          ))}
        </div>
      </fieldset>
      <Button type="submit" className="h-12 w-full text-base" disabled={save.isPending} data-testid="button-save-profile">
        {save.isPending ? t("loading") : t("save")}
      </Button>
    </form>
  );
}
