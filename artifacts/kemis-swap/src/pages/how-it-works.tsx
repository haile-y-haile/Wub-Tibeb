import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, Download, FileText, RotateCcw } from "lucide-react";
import { SafetyNote } from "@/components/kit";
import { useI18n } from "@/lib/i18n";
import { basePath } from "@/lib/kemis";
import { LESSONS, type LessonId } from "@/lib/tutorials";
import { TUTORIAL_MEDIA } from "@/lib/tutorial-media";
import { cn } from "@/lib/utils";

const COPY = {
  en: {
    kicker: "First time here?", title: "See how a swap really works",
    lead: "Three short, captioned walkthroughs using labeled examples. The listing guide demonstrates the app’s real listing form. Pick a lesson, press play.",
    sample: "Every dress, name and message in these clips is a labeled example. Nothing in them was saved or matched.",
    transcript: "Step by step", min: "min", sec: "s", mb: "MB", size: "Download size",
    error: "This clip could not load. Check your connection and try again.", retry: "Try again",
    open: "Open the clip file", rules: "The rules, plainly",
    r: [
      "A dress for a dress. No money, no fees.",
      "You like one specific dress while offering one of your own active dresses.",
      "A match happens only when she likes your offered dress for that same dress.",
      "Both of you accept the same handoff proposal, then each confirms the swap separately.",
      "Sample listings are for browsing and cannot be swapped.",
    ],
    lessonLabel: "Lesson",
  },
  am: {
    kicker: "አዲስ ነዎት?", title: "ልውውጥ በእውነት እንዴት እንደሚሠራ ይመልከቱ",
    lead: "የመተግበሪያውን አጠቃቀም በምሳሌ የሚያሳዩ፣ ጽሑፍ ያላቸው ሦስት አጫጭር ድምፅ አልባ ቪዲዮዎች። ቀሚስ የመመዝገቢያ ትምህርቱ እውነተኛውን ቅጽ ይጠቀማል። ትምህርት ይምረጡና ያጫውቱ።",
    sample: "በእነዚህ ቪዲዮዎች ያሉ ቀሚሶች፣ ስሞችና መልእክቶች ሁሉ ምሳሌዎች ናቸው። ምንም አልተቀመጠም፣ ምንም አልተዛመደም።",
    transcript: "ደረጃ በደረጃ", min: "ደቂቃ", sec: "ሰከንድ", mb: "ሜ.ባ", size: "የማውረጃ መጠን",
    error: "ቪዲዮው መጫን አልቻለም። ግንኙነትዎን አረጋግጠው እንደገና ይሞክሩ።", retry: "እንደገና ሞክር",
    open: "የቪዲዮ ፋይሉን ክፈት", rules: "ደንቦቹ በግልጽ",
    r: [
      "ቀሚስ ለቀሚስ። ገንዘብ የለም፣ ክፍያ የለም።",
      "ከራስዎ ንቁ ቀሚሶች አንዱን አቅርበው አንድ የተወሰነ ቀሚስ ይወዳሉ።",
      "መዛመድ የሚሆነው እሷም ለዚያው ቀሚስ የእርስዎን የቀረበ ቀሚስ ስትወድ ብቻ ነው።",
      "ሁለታችሁም አንድ አይነት የርክክብ ሀሳብ ትቀበላላችሁ፤ ከዚያ እያንዳንዳችሁ ለየብቻ ታረጋግጣላችሁ።",
      "ናሙና ቀሚሶች ለማሰሻ ብቻ ናቸው፤ አይለዋወጡም።",
    ],
    lessonLabel: "ትምህርት",
  },
} as const;

const mediaUrl = (stem: string, ext: string) => `${basePath}/api/storage/public-objects/tutorials/${stem}.${ext}`;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Player({ stem, label, lang }: { stem: string; label: string; lang: "en" | "am" }) {
  const c = COPY[lang];
  const wrap = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="relative mx-auto aspect-[640/1316] max-h-[78dvh] w-full max-w-[340px] overflow-hidden rounded-[28px] border-4 border-primary bg-secondary shadow-[0_24px_50px_-24px_hsl(153_45%_15%/.55)]">
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" role="alert" data-testid="status-video-error">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm">{c.error}</p>
          <button type="button" onClick={() => { setFailed(false); setAttempt((a) => a + 1); }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground" data-testid="button-video-retry">
            <RotateCcw className="h-4 w-4" />{c.retry}
          </button>
        </div>
      ) : (
        <video
          key={attempt}
          className="h-full w-full bg-secondary object-contain"
          controls playsInline preload="none"
          poster={near ? mediaUrl(stem, "webp") : undefined}
          src={mediaUrl(stem, "mp4")}
          aria-label={label}
          onError={() => setFailed(true)}
          data-testid={`video-${stem}`}
        >
          <track kind="captions" src={mediaUrl(stem, "vtt")} srcLang={lang} label={lang === "am" ? "አማርኛ" : "English"} default />
        </video>
      )}
    </div>
  );
}

export default function HowItWorks() {
  const { t, lang } = useI18n();
  const c = COPY[lang];
  const [active, setActive] = useState<LessonId>(() => {
    const q = new URLSearchParams(window.location.search).get("lesson");
    return LESSONS.some((l) => l.id === q) ? (q as LessonId) : "listing";
  });
  const lesson = LESSONS.find((l) => l.id === active)!;
  const stem = `${active}-${lang}`;
  const media = TUTORIAL_MEDIA[stem];
  let at = 0;

  return (
    <div className="pb-12">
      <header className="px-4 pb-5 pt-8 md:pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">{c.kicker}</p>
        <div className="tibeb-thin mt-2 w-20 rounded-full" aria-hidden />
        <h1 className="mt-3 max-w-2xl font-display text-[2.1rem] font-semibold leading-[1.05] text-primary md:text-5xl" data-testid="text-how-title">{c.title}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{c.lead}</p>
      </header>

      <div role="tablist" aria-label={t("howItWorks")} className="no-scrollbar mx-4 flex gap-2 overflow-x-auto pb-1">
        {LESSONS.map((l, i) => {
          const on = l.id === active; const m = TUTORIAL_MEDIA[`${l.id}-${lang}`];
          return (
            <button key={l.id} type="button" role="tab" aria-selected={on} onClick={() => setActive(l.id)} data-testid={`tab-lesson-${l.id}`}
              className={cn("flex min-h-14 shrink-0 items-center gap-3 rounded-2xl border px-4 py-2 text-left transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground")}>
              <span className={cn("font-display text-3xl font-semibold leading-none", on ? "text-[hsl(42_70%_62%)]" : "text-accent")}>{i + 1}</span>
              <span>
                <span className="block text-sm font-semibold">{l.title[lang]}</span>
                {m && <span className={cn("block text-[11px]", on ? "opacity-80" : "text-muted-foreground")}>{clock(m.duration)}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <section className="mx-4 mt-5 grid gap-6 md:grid-cols-[minmax(0,340px)_1fr] md:items-start" aria-label={lesson.title[lang]}>
        <div>
          <Player key={stem} stem={stem} label={`${c.lessonLabel}: ${lesson.title[lang]}`} lang={lang} />
          {media && (
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground" data-testid="text-video-meta">
              <span>{Math.floor(media.duration)} {c.sec}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" aria-hidden />{c.size}: {(media.bytes / 1048576).toFixed(1)} {c.mb}</span>
              <span aria-hidden>·</span>
              <a href={mediaUrl(stem, "mp4")} className="underline underline-offset-4" data-testid="link-video-file">{c.open}</a>
            </p>
          )}
          <p className="mx-auto mt-3 max-w-[340px] rounded-xl border border-dashed border-accent bg-card p-3 text-xs leading-relaxed" data-testid="text-sample-note">{c.sample}</p>
        </div>

        <div>
          <div className="overflow-hidden rounded-2xl paper">
            <div className="tibeb-thin" />
            <div className="p-4">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-primary"><FileText className="h-5 w-5" />{c.transcript}</h2>
              <ol className="mt-3 space-y-3" data-testid="list-transcript">
                {lesson.steps.map((s, i) => {
                  const start = at; at += s.dur;
                  return (
                    <li key={s.scene} className="flex gap-3">
                      <span className="mt-0.5 w-10 shrink-0 font-mono text-[11px] text-muted-foreground">{clock(start)}</span>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span>
                      <p className="text-sm leading-relaxed">{s[lang]}</p>
                    </li>
                  );
                })}
              </ol>
              <Link href={lesson.href} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground" data-testid={`link-lesson-cta-${lesson.id}`}>
                {lesson.cta[lang]}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-2xl paper p-4">
            <h2 className="font-display text-lg font-semibold text-primary">{c.rules}</h2>
            <ul className="mt-2 space-y-2 border-l-2 border-accent pl-3 text-sm">
              {c.r.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <div className="mt-4"><SafetyNote /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
