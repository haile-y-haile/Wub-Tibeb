import { useState } from "react";
import { Check, ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import "./_group.css";

const CONDITIONS = [
  "አዲስ ያህል",
  "በትንሹ የተለበሰ",
  "የአጠቃቀም ምልክቶች ያሉበት",
];

const inputFields = [
  { key: "color", label: "ቀለም", placeholder: "ለምሳሌ ነጭ" },
  { key: "fabric", label: "ጨርቅ", placeholder: "ለምሳሌ ጥጥ" },
  { key: "neighborhood", label: "አካባቢ", placeholder: "ለምሳሌ ቦሌ" },
] as const;

export function Current() {
  const [selectedCondition, setSelectedCondition] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const activeCount = Number(Boolean(selectedCondition)) + Object.values(values).filter(Boolean).length;

  const clearAll = () => {
    setSelectedCondition("");
    setValues({});
    setNotice("ሁሉም ማጣሪያዎች ተጠርገዋል");
  };

  return (
    <div className="kemis-mock min-h-[100dvh] w-full overflow-hidden">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[hsl(var(--km-background))]">
        <div className="km-grain pointer-events-none absolute inset-0 opacity-40" />
        <header className="relative flex items-center justify-between px-5 pb-4 pt-5">
          <button type="button" aria-label="ተመለስ" className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))]">
            <ChevronLeft size={19} />
          </button>
          <div className="text-center">
            <p className="wordmark-am text-[19px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ውብ ጥበብ</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[.12em] text-[hsl(var(--km-muted-foreground))]" lang="am">አዲስ አበባ</p>
          </div>
          <button type="button" className="rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-2.5 py-1.5 text-[11px] font-semibold text-[hsl(var(--km-primary))]">አማ / EN</button>
        </header>

        <div className="km-tibeb relative" />
        <main className="relative px-4 pb-8 pt-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--km-clay))]">የማህበረሰብ ልብስ ልውውጥ</p>
              <h1 className="mt-1 font-['Fraunces'] text-[28px] font-semibold leading-tight text-[hsl(var(--km-primary))]" lang="am">ቀሚሶችን ያግኙ</h1>
            </div>
            <span className="pb-1 text-xs text-[hsl(var(--km-muted-foreground))]" lang="am">24 ቀሚሶች</span>
          </div>

          <div className="flex gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-4">
              <Search size={16} className="shrink-0 text-[hsl(var(--km-muted-foreground))]" />
              <span className="text-sm text-[hsl(var(--km-muted-foreground))]" lang="am">ቀሚስ ፈልግ…</span>
            </div>
            <button type="button" aria-label="ማጣሪያዎች" aria-expanded="true" className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] px-3 text-[hsl(var(--km-primary-foreground))]">
              <SlidersHorizontal size={16} />
              {activeCount > 0 && <span className="text-xs font-semibold">{activeCount}</span>}
            </button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button type="button" aria-pressed="false" className="shrink-0 rounded-full border border-[hsl(var(--km-accent))] bg-[hsl(var(--km-accent)/.16)] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--km-primary))]" lang="am">ተስማሚ ቀሚሶች ብቻ</button>
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-3.5 py-2 text-xs text-[hsl(var(--km-foreground))]" lang="am">ለበዓል</button>
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-3.5 py-2 text-xs text-[hsl(var(--km-foreground))]" lang="am">ለሰርግ</button>
          </div>

          <section className="km-paper km-rise mt-4 rounded-[22px] p-4" aria-label="የቀሚስ ማጣሪያዎች">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[hsl(var(--km-clay))]" lang="am">ማጣሪያ</p>
                <h2 className="mt-1 text-base font-bold text-[hsl(var(--km-primary))]" lang="am">የሚፈልጉትን ይምረጡ</h2>
              </div>
              <span className="rounded-full bg-[hsl(var(--km-secondary))] px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--km-primary))]">{activeCount} የተመረጡ</span>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-[hsl(var(--km-muted-foreground))]" lang="am">ሁኔታ</p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((condition) => {
                  const on = selectedCondition === condition;
                  return (
                    <button key={condition} type="button" aria-pressed={on} onClick={() => setSelectedCondition(on ? "" : condition)}
                      className={`min-h-10 rounded-full border px-3 py-2 text-[12px] transition-colors ${on ? "border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] text-[hsl(var(--km-primary-foreground))]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] text-[hsl(var(--km-foreground))]"}`} lang="am">
                      {on && <Check size={13} className="mr-1 inline" />}{condition}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {inputFields.map((field) => (
                <label key={field.key} className="min-w-0">
                  <span className="mb-1 block text-[10px] font-bold text-[hsl(var(--km-muted-foreground))]" lang="am">{field.label}</span>
                  <input value={values[field.key] ?? ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                    placeholder={field.placeholder} aria-label={field.label}
                    className="h-10 w-full min-w-0 rounded-xl border border-[hsl(var(--km-border))] bg-[hsl(var(--km-background))] px-2 text-[11px] text-[hsl(var(--km-foreground))] outline-none focus:border-[hsl(var(--km-primary))]" lang="am" />
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--km-border))] pt-3">
              <button type="button" onClick={clearAll} className="min-h-10 rounded-full px-3 text-xs font-semibold text-[hsl(var(--km-muted-foreground))] hover:bg-[hsl(var(--km-muted))]" lang="am">ሁሉን አጽዳ</button>
              <button type="button" onClick={() => setNotice("ማጣሪያዎቹ ተተግብረዋል")} className="min-h-10 rounded-full bg-[hsl(var(--km-primary))] px-5 text-xs font-bold text-[hsl(var(--km-primary-foreground))]" lang="am">ውጤቶችን አሳይ</button>
            </div>
            {notice && <p role="status" className="mt-2 text-center text-xs font-semibold text-[hsl(var(--km-primary))]" lang="am">{notice}</p>}
          </section>

          <div className="km-paper mt-4 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--km-secondary))] text-[18px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ሀ</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[hsl(var(--km-primary))]" lang="am">የቀሚሱ ታሪክ ከሰሪው ይጀምራል</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--km-muted-foreground))]" lang="am">ልብስ ሲለዋወጥ ታሪኩም ይቀጥላል</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--km-accent))]" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
