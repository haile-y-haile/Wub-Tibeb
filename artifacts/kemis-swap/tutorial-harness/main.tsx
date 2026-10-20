// ISOLATED RECORDING HARNESS — development only, never part of the production
// build (vite build only bundles ../index.html). It renders example data, has no
// auth, and never calls a mutation: the real ListingForm is mounted but Save is
// never clicked. Driven by render.mjs via window.__setStep.
import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCheck, Circle, Heart, LayoutGrid, Layers, MapPin, Plus, Send, X } from "lucide-react";
import type { Listing } from "@workspace/api-client-react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ListingForm } from "@/components/listing-form";
import { EmptyState, FitBadge, PageHeader, SafetyNote } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LESSONS, TUTORIAL_COPY, type LessonId } from "@/lib/tutorials";
import { basePath } from "@/lib/kemis";
import { cn } from "@/lib/utils";
import "@/index.css";

const params = new URLSearchParams(location.search);
const lessonId = (params.get("lesson") ?? "listing") as LessonId;
const lesson = LESSONS.find((l) => l.id === lessonId)!;
const img = (n: number) => `${basePath}/images/kemis-${n}.webp`;
const noop = () => {};

function ExampleBadge({ className }: { className?: string }) {
  const { lang } = useI18n();
  return <span className={cn("inline-flex rounded-full border border-dashed border-accent bg-card/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary", className)}>{TUTORIAL_COPY[lang].example}</span>;
}

function Frame({ step, children }: { step: number; children: ReactNode }) {
  const { t, lang } = useI18n();
  const s = lesson.steps[step];
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="sticky top-0 z-40">
        <div className="bg-primary px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide text-primary-foreground">{TUTORIAL_COPY[lang].banner}</div>
        <div className="flex h-12 items-center gap-2 border-b border-border/70 bg-background/95 px-4">
          <img src={`${basePath}/logo.svg`} alt="" className="h-7 w-7" />
          <span className="wordmark text-[16px] text-primary">{t("appName")}</span>
          <span className="ml-auto font-display text-xs italic text-muted-foreground">{lesson.title[lang]}</span>
        </div>
      </div>
      <div className="pb-48">{children}</div>
      <div className="fixed inset-x-0 bottom-0 z-50 p-3">
        <div className="overflow-hidden rounded-2xl bg-[hsl(153_40%_12%/.95)] text-[hsl(44_60%_96%)] shadow-[0_12px_30px_-10px_hsl(153_45%_10%/.6)]">
          <div className="tibeb-thin" />
          <div className="flex gap-3 p-3.5">
            <span className="font-display text-2xl font-semibold leading-none text-[hsl(42_70%_62%)]">{step + 1}<span className="text-sm opacity-70">/{lesson.steps.length}</span></span>
            <p className="text-[15px] font-medium leading-snug">{s[lang]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Lesson 1: listing (real ListingForm) ---------- */
function ListingScenes({ scene }: { scene: string }) {
  const { t, lang } = useI18n();
  if (scene === "auth") return (
    <div className="space-y-4 px-4 pt-6">
      <div className="rounded-3xl paper p-5 text-center">
        <img src={`${basePath}/logo.svg`} alt="" className="mx-auto h-12 w-12" />
        <p className="mt-2 font-display text-lg italic text-accent-foreground/80">{t("tagline")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <span id="tap-join" className="inline-flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{t("getStarted")}</span>
          <span className="inline-flex h-12 items-center justify-center rounded-full border border-primary font-semibold text-primary">{t("signIn")}</span>
        </div>
      </div>
      <div className="rounded-3xl paper p-5">
        <h2 className="font-display text-xl text-primary">{t("setupTitle")}</h2>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5"><Label>{t("yourName")}</Label><Input readOnly value={lang === "am" ? "ሐና" : "Hanna"} className="h-11 bg-card" /></div>
          <div className="space-y-1.5"><Label>{t("neighborhood")}</Label><Input readOnly value={t("exampleNeighborhood")} className="h-11 bg-card" /></div>
        </div>
      </div>
    </div>
  );
  if (scene === "wardrobe") return (
    <div>
      <PageHeader kicker={t("tagline")} title={t("wardrobe")} action={<Button id="tap-add" className="h-11 rounded-full"><Plus className="mr-1 h-4 w-4" />{t("addDress")}</Button>} />
      <EmptyState title={t("wardrobeEmpty")} sub={t("wardrobeEmptySub")} />
    </div>
  );
  const withPhotos = scene !== "form";
  const sample = { photos: ["/images/kemis-1.webp", "/images/kemis-4.webp", "/images/kemis-6.webp"] } as unknown as Listing;
  return (
    <div className="px-3 pt-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-4 font-display text-2xl text-primary">{t("newListing")}</h2>
        <ListingForm key={withPhotos ? "photos" : "empty"} listing={withPhotos ? sample : undefined} onDone={noop} />
      </div>
    </div>
  );
}

/* ---------- Lesson 2: matching (replica of Discover markup) ---------- */
function MatchingScenes({ scene }: { scene: string }) {
  const { t, e, lang } = useI18n();
  const c = TUTORIAL_COPY[lang];
  const titles = lang === "am" ? ["ወርቃማ ጥበብ ያለው ነጭ ቀሚስ", "ሰማያዊ ጥበብ ያለው ቀሚስ", t("exampleTitle")] : ["White kemis with gold tibeb", "Kemis with blue tibeb", t("exampleTitle")];
  const card = scene === "sent" ? 1 : 0;
  const swiping = scene === "like";
  if (scene === "pair") return (
    <div className="space-y-4 px-4 pt-6">
      {[[c.pairYou, img(1), img(2), true], [c.pairHer, img(2), img(1), false]].map(([label, a, b, done], i) => (
        <div key={i} className="rounded-2xl paper p-4">
          <p className="mb-3 text-sm font-semibold text-primary">{label as string}</p>
          <div className="flex items-center justify-center gap-3">
            <img src={a as string} alt="" className="h-28 w-20 rounded-xl object-cover" />
            <Heart className="h-6 w-6 text-accent" />
            <img src={b as string} alt="" className="h-28 w-20 rounded-xl object-cover" />
            <span className={cn("ml-2 grid h-9 w-9 place-items-center rounded-full", done ? "bg-primary text-primary-foreground" : "border-2 border-dashed border-accent text-accent")}>{done ? <Check className="h-5 w-5" /> : <Circle className="h-3 w-3" />}</span>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground">{t("liked")}</p>
    </div>
  );
  if (scene === "match") return (
    <div className="px-4 pt-10">
      <div className="overflow-hidden rounded-3xl bg-card shadow-[0_18px_40px_-18px_hsl(153_45%_15%/.45)]">
        <div className="tibeb" />
        <div className="p-6 text-center">
          <div className="mb-4 flex justify-center gap-2"><img src={img(1)} alt="" className="h-24 w-18 rounded-xl object-cover" /><img src={img(2)} alt="" className="h-24 w-18 rounded-xl object-cover" /></div>
          <h2 className="font-display text-3xl text-primary">{t("itsAMatch")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("matchSub")}</p>
          <div className="mt-5 flex flex-col gap-2"><Button id="tap-chat" className="h-12">{t("openChat")}</Button><Button variant="ghost">{t("keepBrowsing")}</Button></div>
          <ExampleBadge className="mt-3" />
        </div>
      </div>
    </div>
  );
  return (
    <div>
      <PageHeader kicker={t("tagline")} title={t("discover")} action={
        <div className="flex rounded-full border border-border bg-card p-0.5">
          <span className="flex min-h-9 items-center gap-1 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground"><Layers className="h-4 w-4" />{t("swipe")}</span>
          <span className="flex min-h-9 items-center gap-1 px-3 text-xs font-semibold text-muted-foreground"><LayoutGrid className="h-4 w-4" />{t("grid")}</span>
        </div>} />
      <div className="mx-4 rounded-2xl border border-dashed border-accent bg-card/70 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("offering")}</p>
        <div className="flex gap-2">
          <span id="tap-offer" className="flex items-center gap-2 rounded-full border border-primary bg-primary p-1 pr-3 text-sm text-primary-foreground"><img src={img(1)} alt="" className="h-8 w-8 rounded-full object-cover" /><span className="max-w-[9rem] truncate">{titles[2]}</span></span>
          <span className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 text-sm"><img src={img(5)} alt="" className="h-8 w-8 rounded-full object-cover" /><span className="max-w-[5rem] truncate">{titles[1]}</span></span>
        </div>
      </div>
      <div className="px-4 pt-4">
        <div className="relative mx-auto aspect-[3/4] w-[86%]">
          <div className="absolute inset-0 translate-y-3 scale-[.95] overflow-hidden rounded-[28px] bg-secondary opacity-70"><img src={img(card ? 3 : 3)} alt="" className="h-full w-full object-cover" /></div>
          <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-secondary shadow-[0_18px_40px_-18px_hsl(153_45%_15%/.45)]"
            style={{ transform: swiping ? "translateX(70px) rotate(5deg)" : undefined }}>
            <img src={img(card ? 3 : 2)} alt="" className="h-full w-full object-cover" />
            <div className="absolute left-3 top-4 flex gap-1"><ExampleBadge /><FitBadge /></div>
            {swiping && <div className="absolute right-5 top-14 rotate-12 rounded-lg border-4 border-accent px-3 py-1 font-display text-2xl font-bold text-accent">{t("like")}</div>}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(153_40%_8%/.92)] via-[hsl(153_40%_8%/.55)] to-transparent p-4 pt-16 text-[hsl(44_60%_96%)]">
              <div className="tibeb-thin mb-2 w-16 rounded-full" />
              <h2 className="font-display text-xl font-semibold leading-tight">{titles[card]}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm opacity-90"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.hood}</span><span>{e("Meskel")}</span><span>{e("Excellent")}</span></p>
              <p id="measure-line" className="mt-1 text-xs opacity-90">{t("bust")} 92 · {t("waist")} 76 · {t("length")} 140 {t("cm")}</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-4 flex items-center justify-center gap-6">
          <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-border bg-card text-muted-foreground"><X className="h-6 w-6" /></span>
          <span id="tap-like" className="flex h-14 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-background"><Heart className="h-5 w-5" />{t("like")}</span>
        </div>
      </div>
      {scene === "sent" && <div className="fixed inset-x-4 top-28 z-40 rounded-xl border border-border bg-card p-3 text-sm font-semibold shadow-lg">{t("liked")}</div>}
    </div>
  );
}

/* ---------- Lesson 3: exchange (replica of match-detail markup) ---------- */
function ExchangeScenes({ scene }: { scene: string }) {
  const { t, e, lang } = useI18n();
  const c = TUTORIAL_COPY[lang];
  const order = ["open", "chat", "propose", "accept", "handoff", "complete", "done"];
  const n = order.indexOf(scene);
  const proposalText = lang === "am" ? "ቅዳሜ 4:00 ኤድና ሞል መግቢያ" : "Saturday 10:00 at Edna Mall entrance";
  const proposed = n >= 2, iAcc = n >= 3, sheAcc = n >= 3, iDone = n >= 5, sheDone = n >= 6;
  const status = sheDone ? "completed" : iAcc ? "accepted" : proposed ? "proposed" : "matched";
  const msgs = n >= 1 ? [
    { own: false, text: lang === "am" ? "ሰላም! ቀሚስዎ በጣም ያምራል።" : "Hello! Your kemis is lovely." },
    { own: true, text: lang === "am" ? "እናመሰግናለን! ቅዳሜ ይመችሻል?" : "Thank you! Does Saturday work?" },
  ] : [];
  const Party = ({ who, accepted, done }: { who: string; accepted: boolean; done: boolean }) => (
    <div className="flex-1 rounded-xl bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{who}</p>
      <p className="mt-1 flex items-center gap-1 text-sm">{accepted ? <Check className="h-4 w-4 text-primary" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}{accepted ? t("accepted") : t("waiting")}</p>
      <p className="flex items-center gap-1 text-sm">{done ? <CheckCheck className="h-4 w-4 text-primary" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}{done ? t("completed") : t("waiting")}</p>
    </div>
  );
  if (scene === "handoff") return (
    <div className="space-y-4 px-4 pt-6">
      <div className="flex items-center justify-center gap-4 rounded-3xl paper p-6">
        <img src={img(1)} alt="" className="h-36 w-24 rounded-xl object-cover" />
        <div className="text-center text-accent"><ArrowLeft className="mx-auto h-5 w-5 rotate-180" /><ArrowLeft className="mx-auto h-5 w-5" /></div>
        <img src={img(2)} alt="" className="h-36 w-24 rounded-xl object-cover" />
      </div>
      <p className="rounded-2xl paper p-4 text-center font-display text-lg text-primary"><MapPin className="mr-1 inline h-4 w-4" />{proposalText}</p>
      <SafetyNote />
    </div>
  );
  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"><ArrowLeft className="h-5 w-5 text-primary" /></span>
        <div><h1 className="font-display text-xl font-semibold text-primary">{c.partner}</h1><p className="text-xs text-muted-foreground">{c.hood} · {e(status)}</p></div>
      </div>
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        {[[t("yourDress"), img(1), t("exampleTitle")], [t("herDress"), img(2), lang === "am" ? "ወርቃማ ጥበብ ያለው ነጭ ቀሚስ" : "White kemis with gold tibeb"]].map(([label, src, title]) => (
          <div key={label} className="overflow-hidden rounded-2xl paper">
            <div className={cn("relative", n === 0 ? "aspect-[4/5]" : "aspect-[5/3]")}><img src={src} alt="" className="h-full w-full object-cover" /><ExampleBadge className="absolute left-2 top-2" /></div>
            <div className="p-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold">{title}</p></div>
          </div>
        ))}
      </div>
      {n === 1 ? (
        <section className="mx-4 mt-3 rounded-2xl paper">
          <div className="space-y-2 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.own ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border p-2">
            <span className="flex h-11 flex-1 items-center rounded-full border border-input bg-background px-4 text-sm text-muted-foreground">{t("typeMessage")}</span>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"><Send className="h-4 w-4" /></span>
          </div>
        </section>
      ) : (
        <section className="mx-4 mt-3 overflow-hidden rounded-2xl paper">
          <div className="tibeb-thin" />
          <div className="space-y-3 p-3">
            <div className="flex gap-2"><Party who={t("you")} accepted={iAcc} done={iDone} /><Party who={t("them")} accepted={sheAcc} done={sheDone} /></div>
            {sheDone ? (
              <p className="rounded-xl bg-secondary p-3 text-center font-display text-lg text-primary"><CheckCheck className="mr-1 inline h-5 w-5" />{e("completed")}</p>
            ) : (
              <>
                <label className="text-sm font-semibold text-primary">{t("proposal")}</label>
                <Textarea readOnly rows={2} value={n >= 2 ? proposalText : ""} placeholder={t("proposalHint")} className="bg-background" />
                <div className="grid grid-cols-2 gap-2">
                  <Button id="tap-propose" variant="outline" className="h-11" disabled={n !== 2}>{t("propose")}</Button>
                  <Button id="tap-accept" className="h-11" disabled={n !== 3}>{t("accept")}</Button>
                  <Button id="tap-complete" className="h-11 bg-accent text-accent-foreground" disabled={n !== 5}>{t("complete")}</Button>
                  <Button variant="ghost" className="h-11 text-destructive">{t("cancelSwap")}</Button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Harness() {
  const { setLang } = useI18n();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const l = params.get("lang");
    if (l === "am" || l === "en") setLang(l);
    (window as unknown as { __setStep: (n: number) => void }).__setStep = (n) => { window.scrollTo(0, 0); setStep(n); };
  }, [setLang]);
  const scene = lesson.steps[step].scene;
  return (
    <Frame step={step}>
      {lesson.id === "listing" ? <ListingScenes scene={scene} /> : lesson.id === "matching" ? <MatchingScenes scene={scene} /> : <ExchangeScenes scene={scene} />}
    </Frame>
  );
}

const qc = new QueryClient({ defaultOptions: { queries: { enabled: false } } });
createRoot(document.getElementById("root")!).render(
  <I18nProvider><QueryClientProvider client={qc}><Harness /></QueryClientProvider></I18nProvider>,
);
