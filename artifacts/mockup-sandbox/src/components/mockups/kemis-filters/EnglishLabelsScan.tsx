import { useState } from "react";
import { Check, ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import "./_group.css";

const conditions = [
  { am: "አዲስ ያህል", en: "Like new" },
  { am: "በትንሹ የተለበሰ", en: "Gently worn" },
  { am: "የአጠቃቀም ምልክቶች ያሉበት", en: "Visible signs of wear" },
];

const fields = [
  { key: "color", am: "ቀለም", en: "Color", placeholder: "e.g. White", amPlaceholder: "ለምሳሌ ነጭ" },
  { key: "fabric", am: "ጨርቅ", en: "Fabric", placeholder: "e.g. Cotton", amPlaceholder: "ለምሳሌ ጥጥ" },
  { key: "neighborhood", am: "አካባቢ", en: "Neighborhood", placeholder: "e.g. Bole", amPlaceholder: "ለምሳሌ ቦሌ" },
];

export function EnglishLabelsScan() {
  const [english, setEnglish] = useState(true);
  const [condition, setCondition] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [occasion, setOccasion] = useState("Dresses that fit");
  const [notice, setNotice] = useState("");
  const count = Number(Boolean(condition)) + Object.values(values).filter(Boolean).length;
  const chooseCopy = english ? "Choose what you’re looking for" : "የሚፈልጉትን ይምረጡ";
  const clearCopy = english ? "Clear all" : "ሁሉን አጽዳ";
  const applyCopy = english ? "Show results" : "ውጤቶችን አሳይ";

  const clearAll = () => {
    setCondition("");
    setValues({});
    setNotice(english ? "All filters cleared." : "ሁሉም ማጣሪያዎች ተጠርገዋል");
  };

  return (
    <div className="kemis-mock min-h-[100dvh] w-full overflow-hidden">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[hsl(var(--km-background))]">
        <div className="km-grain pointer-events-none absolute inset-0 opacity-40" />
        <header className="relative flex items-center justify-between px-5 pb-3 pt-5">
          <button type="button" aria-label={english ? "Go back" : "ተመለስ"} className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))]">
            <ChevronLeft size={19} />
          </button>
          <div className="text-center">
            <p className="wordmark-am text-[19px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ውብ ጥበብ</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[.12em] text-[hsl(var(--km-muted-foreground))]">ADDIS ABABA · አዲስ አበባ</p>
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
        <main className="relative px-4 pb-8 pt-4">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--km-clay))]">{english ? "COMMUNITY CLOTHING EXCHANGE" : "የማህበረሰብ ልብስ ልውውጥ"}</p>
              <h1 className="mt-1 font-['Fraunces'] text-[29px] font-semibold leading-tight text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{english ? "Find dresses" : "ቀሚሶችን ያግኙ"}</h1>
            </div>
            <span className="pb-1 text-xs text-[hsl(var(--km-muted-foreground))]">{english ? "24 dresses" : "24 ቀሚሶች"}</span>
          </div>

          <div className="flex gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-4">
              <Search size={16} className="shrink-0 text-[hsl(var(--km-muted-foreground))]" />
              <input aria-label={english ? "Search dresses" : "ቀሚስ ፈልግ"} placeholder={english ? "Search dresses…" : "ቀሚስ ፈልግ…"} className="min-w-0 flex-1 bg-transparent text-sm text-[hsl(var(--km-foreground))] outline-none placeholder:text-[hsl(var(--km-muted-foreground))]" />
            </div>
            <button type="button" aria-label={english ? "Filters" : "ማጣሪያዎች"} aria-expanded="true" className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] px-3 text-[hsl(var(--km-primary-foreground))]">
              <SlidersHorizontal size={16} />
              {count > 0 && <span className="text-xs font-semibold">{count}</span>}
            </button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {(english ? ["Dresses that fit", "For a holiday", "For a wedding"] : ["ተስማሚ ቀሚሶች ብቻ", "ለበዓል", "ለሰርግ"]).map((label, index) => (
              <button key={label} type="button" onClick={() => setOccasion(label)} aria-pressed={occasion === label} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${occasion === label ? "border-[hsl(var(--km-accent))] bg-[hsl(var(--km-accent)/.16)] text-[hsl(var(--km-primary))]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] text-[hsl(var(--km-foreground))]"}`}>
                {label}{index === 0 && <span className="ml-1.5 text-[10px]" aria-hidden="true">⌄</span>}
              </button>
            ))}
          </div>

          <section className="km-paper km-rise mt-4 rounded-[22px] p-4" aria-label={english ? "Dress filters" : "የቀሚስ ማጣሪያዎች"}>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[hsl(var(--km-clay))]">{english ? "FILTERS · ማጣሪያ" : "ማጣሪያ · FILTERS"}</p>
                <h2 className="mt-1 text-[17px] font-bold leading-snug text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{chooseCopy}</h2>
              </div>
              <span className="shrink-0 rounded-full bg-[hsl(var(--km-secondary))] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--km-primary))]">
                {count} {english ? (count === 1 ? "selected" : "selected") : "የተመረጡ"}
              </span>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[.1em] text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{english ? "Condition" : "ሁኔታ"}</p>
                <p className="text-[10px] text-[hsl(var(--km-muted-foreground))]" lang="am">ሁኔታ</p>
              </div>
              <div className="flex flex-col gap-2">
                {conditions.map((item) => {
                  const active = condition === item.am;
                  return (
                    <button key={item.am} type="button" aria-pressed={active} onClick={() => setCondition(active ? "" : item.am)} className={`flex min-h-12 items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-colors ${active ? "border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] text-[hsl(var(--km-primary-foreground))]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] text-[hsl(var(--km-foreground))]"}`}>
                      <span className="flex flex-col">
                        <span className="text-[14px] font-semibold leading-tight">{english ? item.en : item.am}</span>
                        <span className={`mt-0.5 text-[11px] leading-tight ${active ? "text-[hsl(var(--km-primary-foreground)/.78)]" : "text-[hsl(var(--km-muted-foreground))]"}`} lang={english ? "am" : "en"}>{english ? item.am : item.en}</span>
                      </span>
                      {active ? <Check size={16} /> : <span className="h-[17px] w-[17px] rounded-full border border-[hsl(var(--km-border))]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {fields.map((field) => (
                <label key={field.key} className="min-w-0">
                  <span className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[12px] font-bold text-[hsl(var(--km-foreground))]">{english ? field.en : field.am}</span>
                    <span className="text-[10px] text-[hsl(var(--km-muted-foreground))]" lang={english ? "am" : "en"}>{english ? field.am : field.en}</span>
                  </span>
                  <input
                    value={values[field.key] ?? ""}
                    onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                    placeholder={english ? field.placeholder : field.amPlaceholder}
                    aria-label={english ? `${field.en} filter` : `${field.am} ማጣሪያ`}
                    className="h-11 w-full rounded-xl border border-[hsl(var(--km-border))] bg-[hsl(var(--km-background))] px-3 text-[13px] text-[hsl(var(--km-foreground))] outline-none focus:border-[hsl(var(--km-primary))]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--km-border))] pt-3">
              <button type="button" onClick={clearAll} className="min-h-10 rounded-full px-3 text-xs font-semibold text-[hsl(var(--km-muted-foreground))] hover:bg-[hsl(var(--km-muted))]">{clearCopy}</button>
              <button type="button" onClick={() => setNotice(english ? "Filters applied." : "ማጣሪያዎቹ ተተግብረዋል")} className="min-h-10 rounded-full bg-[hsl(var(--km-primary))] px-5 text-xs font-bold text-[hsl(var(--km-primary-foreground))]">{applyCopy}</button>
            </div>
            {notice && <p role="status" className="mt-2 text-center text-xs font-semibold text-[hsl(var(--km-primary))]">{notice}</p>}
          </section>

          <div className="km-paper mt-4 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--km-secondary))] text-[18px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ሀ</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[hsl(var(--km-primary))]" lang={english ? "en" : "am"}>{english ? "Every dress begins with its maker" : "የቀሚሱ ታሪክ ከሰሪው ይጀምራል"}</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--km-muted-foreground))]" lang={english ? "en" : "am"}>{english ? "When a garment changes hands, its story continues." : "ልብስ ሲለዋወጥ ታሪኩም ይቀጥላል"}</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--km-accent))]" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
