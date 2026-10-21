import { useState } from "react";
import { Check, ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import "./_group.css";

const CONDITIONS = [
  { am: "አዲስ ያህል", en: "Like new" },
  { am: "በትንሹ የተለበሰ", en: "Gently worn" },
  { am: "የአጠቃቀም ምልክቶች ያሉበት", en: "Visible signs of wear" },
];

const INPUT_FIELDS = [
  { key: "color", am: "ቀለም", en: "Color", amPlaceholder: "ለምሳሌ ነጭ", enPlaceholder: "e.g. White" },
  { key: "fabric", am: "ጨርቅ", en: "Fabric", amPlaceholder: "ለምሳሌ ጥጥ", enPlaceholder: "e.g. Cotton" },
  { key: "neighborhood", am: "አካባቢ", en: "Neighborhood", amPlaceholder: "ለምሳሌ ቦሌ", enPlaceholder: "e.g. Bole" },
] as const;

export function EnglishLabels() {
  const [english, setEnglish] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const activeCount = Number(Boolean(selectedCondition)) + Object.values(values).filter(Boolean).length;
  const text = english
    ? {
        back: "Go back",
        city: "ADDIS ABABA",
        eyebrow: "COMMUNITY CLOTHING EXCHANGE",
        title: "Find dresses",
        count: "24 dresses",
        search: "Search dresses…",
        filters: "Filters",
        occasion: "Dresses that fit",
        holiday: "For a holiday",
        wedding: "For a wedding",
        filterEyebrow: "FILTERS",
        choose: "Choose what you’re looking for",
        selected: "selected",
        condition: "CONDITION",
        clear: "Clear all",
        apply: "Show results",
        storyTitle: "Every dress begins with its maker",
        storyBody: "When a garment changes hands, its story continues.",
        clearNotice: "All filters have been cleared.",
        applyNotice: "Filters applied.",
      }
    : {
        back: "ተመለስ",
        city: "አዲስ አበባ",
        eyebrow: "የማህበረሰብ ልብስ ልውውጥ",
        title: "ቀሚሶችን ያግኙ",
        count: "24 ቀሚሶች",
        search: "ቀሚስ ፈልግ…",
        filters: "ማጣሪያዎች",
        occasion: "ተስማሚ ቀሚሶች ብቻ",
        holiday: "ለበዓል",
        wedding: "ለሰርግ",
        filterEyebrow: "ማጣሪያ",
        choose: "የሚፈልጉትን ይምረጡ",
        selected: "የተመረጡ",
        condition: "ሁኔታ",
        clear: "ሁሉን አጽዳ",
        apply: "ውጤቶችን አሳይ",
        storyTitle: "የቀሚሱ ታሪክ ከሰሪው ይጀምራል",
        storyBody: "ልብስ ሲለዋወጥ ታሪኩም ይቀጥላል",
        clearNotice: "ሁሉም ማጣሪያዎች ተጠርገዋል",
        applyNotice: "ማጣሪያዎቹ ተተግብረዋል",
      };

  const clearAll = () => {
    setSelectedCondition("");
    setValues({});
    setNotice(text.clearNotice);
  };

  return (
    <div className="kemis-mock min-h-[100dvh] w-full overflow-hidden">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[hsl(var(--km-background))]">
        <div className="km-grain pointer-events-none absolute inset-0 opacity-40" />
        <header className="relative flex items-center justify-between px-5 pb-4 pt-5">
          <button type="button" aria-label={text.back} className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))]">
            <ChevronLeft size={19} />
          </button>
          <div className="text-center">
            <p className="wordmark-am text-[19px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ውብ ጥበብ</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[.12em] text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{text.city}</p>
          </div>
          <button
            type="button"
            onClick={() => { setEnglish(!english); setNotice(""); }}
            aria-label={english ? "Switch to Amharic" : "Switch to English"}
            aria-pressed={english}
            className="rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-2.5 py-1.5 text-[11px] font-semibold text-[hsl(var(--km-primary))]"
          >
            {english ? "EN / አማ" : "አማ / EN"}
          </button>
        </header>

        <div className="km-tibeb relative" />
        <main className="relative px-4 pb-8 pt-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--km-clay))]" lang={english ? "en" : "am"}>{text.eyebrow}</p>
              <h1 className="mt-1 font-['Fraunces'] text-[28px] font-semibold leading-tight text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{text.title}</h1>
            </div>
            <span className="pb-1 text-xs text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{text.count}</span>
          </div>

          <div className="flex gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-4">
              <Search size={16} className="shrink-0 text-[hsl(var(--km-muted-foreground))]" />
              <span className="text-sm text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{text.search}</span>
            </div>
            <button type="button" aria-label={text.filters} aria-expanded="true" className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] px-3 text-[hsl(var(--km-primary-foreground))]">
              <SlidersHorizontal size={16} />
              {activeCount > 0 && <span className="text-xs font-semibold">{activeCount}</span>}
            </button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button type="button" aria-pressed="false" className="shrink-0 rounded-full border border-[hsl(var(--km-accent))] bg-[hsl(var(--km-accent)/.16)] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{text.occasion}</button>
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-3.5 py-2 text-xs text-[hsl(var(--km-foreground))]" lang={english ? "en" : "am"}>{text.holiday}</button>
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-3.5 py-2 text-xs text-[hsl(var(--km-foreground))]" lang={english ? "en" : "am"}>{text.wedding}</button>
          </div>

          <section className="km-paper km-rise mt-4 rounded-[22px] p-4" aria-label={english ? "Dress filters" : "የቀሚስ ማጣሪያዎች"}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[hsl(var(--km-clay))]" lang={english ? "en" : "am"}>{text.filterEyebrow}</p>
                <h2 className="mt-1 text-base font-bold text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{text.choose}</h2>
              </div>
              <span className="shrink-0 rounded-full bg-[hsl(var(--km-secondary))] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--km-primary))]">
                {activeCount} {text.selected}
              </span>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{text.condition}</p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((condition) => {
                  const label = english ? condition.en : condition.am;
                  const on = selectedCondition === condition.am;
                  return (
                    <button
                      key={condition.am}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelectedCondition(on ? "" : condition.am)}
                      className={`min-h-10 rounded-full border px-3 py-2 text-[12px] transition-colors ${on ? "border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] text-[hsl(var(--km-primary-foreground))]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] text-[hsl(var(--km-foreground))]"}`}
                      lang={english ? "en" : "am"}
                    >
                      {on && <Check size={13} className="mr-1 inline" />}{label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {INPUT_FIELDS.map((field) => (
                <label key={field.key} className="min-w-0">
                  <span className="mb-1 block text-[10px] font-bold text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{english ? field.en : field.am}</span>
                  <input
                    value={values[field.key] ?? ""}
                    onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                    placeholder={english ? field.enPlaceholder : field.amPlaceholder}
                    aria-label={english ? field.en : field.am}
                    className="h-10 w-full min-w-0 rounded-xl border border-[hsl(var(--km-border))] bg-[hsl(var(--km-background))] px-2 text-[11px] text-[hsl(var(--km-foreground))] outline-none focus:border-[hsl(var(--km-primary))]"
                    lang={english ? "en" : "am"}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--km-border))] pt-3">
              <button type="button" onClick={clearAll} className="min-h-10 rounded-full px-3 text-xs font-semibold text-[hsl(var(--km-muted-foreground))] hover:bg-[hsl(var(--km-muted))]" lang={english ? "en" : "am"}>{text.clear}</button>
              <button type="button" onClick={() => setNotice(text.applyNotice)} className="min-h-10 rounded-full bg-[hsl(var(--km-primary))] px-5 text-xs font-bold text-[hsl(var(--km-primary-foreground))]" lang={english ? "en" : "am"}>{text.apply}</button>
            </div>
            {notice && <p role="status" className="mt-2 text-center text-xs font-semibold text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{notice}</p>}
          </section>

          <div className="km-paper mt-4 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--km-secondary))] text-[18px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ሀ</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{text.storyTitle}</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{text.storyBody}</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--km-accent))]" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
