import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import "./_group.css";

const conditions = [
  { value: "new", label: "አዲስ ያህል" },
  { value: "gentle", label: "በትንሹ የተለበሰ" },
  { value: "wear", label: "የአጠቃቀም ምልክቶች ያሉበት" },
];
const sources = [
  { value: "store", label: "ከብራንድ ወይም ከሱቅ የተገዛ" },
  { value: "custom", label: "በአካባቢ ሰሪ በትዕዛዝ የተሰራ" },
];

export function Combined() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(["gentle"]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["custom"]);
  const [feedback, setFeedback] = useState("");
  const activeCount = selectedConditions.length + selectedSources.length;

  const toggle = (value: string, selected: string[], setter: (next: string[]) => void) => {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
    setFeedback("");
  };

  const clear = () => {
    setSelectedConditions([]);
    setSelectedSources([]);
    setFeedback("ሁሉም ማጣሪያዎች ተጠርገዋል");
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
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--km-clay))]" lang="am">አዲስ ልብስ፣ አዲስ ታሪክ</p>
              <h1 className="mt-1 font-['Fraunces'] text-[28px] font-semibold leading-tight text-[hsl(var(--km-primary))]" lang="am">ቀሚሶችን ያግኙ</h1>
            </div>
            <span className="pb-1 text-xs text-[hsl(var(--km-muted-foreground))]" lang="am">24 ቀሚሶች</span>
          </div>

          <div className="flex gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-4">
              <Search size={16} className="shrink-0 text-[hsl(var(--km-muted-foreground))]" />
              <span className="text-sm text-[hsl(var(--km-muted-foreground))]" lang="am">ቀሚስ ፈልግ…</span>
            </div>
            <button type="button" aria-label="ማጣሪያዎች" className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] px-3 text-[hsl(var(--km-primary-foreground))]">
              <SlidersHorizontal size={16} />
              {activeCount > 0 && <span className="text-xs font-semibold">{activeCount}</span>}
            </button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-accent))] bg-[hsl(var(--km-accent)/.16)] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--km-primary))]" lang="am">ለእኔ የሚስማማ</button>
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-3.5 py-2 text-xs text-[hsl(var(--km-foreground))]" lang="am">ለበዓል</button>
            <button type="button" className="shrink-0 rounded-full border border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))] px-3.5 py-2 text-xs text-[hsl(var(--km-foreground))]" lang="am">ለሰርግ</button>
          </div>

          <section className="km-paper km-rise mt-4 overflow-hidden rounded-[24px]">
            <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}
              className="flex min-h-[76px] w-full items-center gap-3 px-4 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--km-primary))] text-[hsl(var(--km-primary-foreground))]">
                <SlidersHorizontal size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--km-clay))]" lang="am">ለልብስዎ የሚመች</span>
                <span className="mt-0.5 block text-base font-bold text-[hsl(var(--km-primary))]" lang="am">የቀሚሱ ዝርዝሮች</span>
              </span>
              {activeCount > 0 && <span className="mr-1 rounded-full bg-[hsl(var(--km-secondary))] px-2.5 py-1 text-[11px] font-bold text-[hsl(var(--km-primary))]">{activeCount}</span>}
              <ChevronDown size={18} className={`text-[hsl(var(--km-muted-foreground))] transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="km-rise border-t border-[hsl(var(--km-border))] px-4 pb-4 pt-4">
                <fieldset>
                  <legend className="mb-2.5 flex w-full items-center gap-2 text-[13px] font-bold text-[hsl(var(--km-primary))]" lang="am">
                    <span className="h-4 w-1 rounded-full bg-[hsl(var(--km-accent))]" />
                    ሁኔታ
                    <span className="ml-auto text-[10px] font-medium text-[hsl(var(--km-muted-foreground))]" lang="am">{selectedConditions.length} ተመርጧል</span>
                  </legend>
                  <div className="space-y-2">
                    {conditions.map((option) => {
                      const checked = selectedConditions.includes(option.value);
                      return (
                        <label key={option.value} className={`flex min-h-[49px] cursor-pointer items-center gap-3 rounded-2xl border px-3 ${checked ? "border-[hsl(var(--km-primary)/.48)] bg-[hsl(var(--km-primary)/.055)]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))]"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggle(option.value, selectedConditions, setSelectedConditions)} className="sr-only" />
                          <span aria-hidden="true" className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px] border ${checked ? "border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] text-[hsl(var(--km-primary-foreground))]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-background))]"}`}>
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span className={`text-[12px] ${checked ? "font-semibold text-[hsl(var(--km-primary))]" : "text-[hsl(var(--km-foreground))]"}`} lang="am">{option.label}</span>
                          {checked && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--km-accent))]" />}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="my-4 h-px bg-[hsl(var(--km-border))]" />

                <fieldset>
                  <legend className="mb-2.5 flex w-full items-center gap-2 text-[13px] font-bold text-[hsl(var(--km-primary))]" lang="am">
                    <span className="h-4 w-1 rounded-full bg-[hsl(var(--km-clay))]" />
                    ሰሪው እና ምንጩ
                    <span className="ml-auto text-[10px] font-medium text-[hsl(var(--km-muted-foreground))]" lang="am">{selectedSources.length} ተመርጧል</span>
                  </legend>
                  <div className="space-y-2">
                    {sources.map((option) => {
                      const checked = selectedSources.includes(option.value);
                      return (
                        <label key={option.value} className={`flex min-h-[49px] cursor-pointer items-center gap-3 rounded-2xl border px-3 ${checked ? "border-[hsl(var(--km-primary)/.48)] bg-[hsl(var(--km-primary)/.055)]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-card))]"}`}>
                          <input type="checkbox" checked={checked} onChange={() => toggle(option.value, selectedSources, setSelectedSources)} className="sr-only" />
                          <span aria-hidden="true" className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px] border ${checked ? "border-[hsl(var(--km-primary))] bg-[hsl(var(--km-primary))] text-[hsl(var(--km-primary-foreground))]" : "border-[hsl(var(--km-border))] bg-[hsl(var(--km-background))]"}`}>
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span className={`text-[12px] leading-5 ${checked ? "font-semibold text-[hsl(var(--km-primary))]" : "text-[hsl(var(--km-foreground))]"}`} lang="am">{option.label}</span>
                          {checked && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--km-accent))]" />}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--km-border))] pt-3">
                  <button type="button" onClick={clear} className="min-h-11 rounded-full px-3 text-xs font-semibold text-[hsl(var(--km-muted-foreground))] hover:bg-[hsl(var(--km-muted))]" lang="am">ሁሉን አጽዳ</button>
                  <button type="button" onClick={() => setFeedback("የመረጡት ማጣሪያ ተተግብሯል")} className="min-h-11 rounded-full bg-[hsl(var(--km-primary))] px-5 text-xs font-bold text-[hsl(var(--km-primary-foreground))]" lang="am">24 ቀሚሶችን አሳይ</button>
                </div>
                {feedback && <p role="status" className="mt-2 text-center text-xs font-semibold text-[hsl(var(--km-primary))]" lang="am">{feedback}</p>}
              </div>
            )}
          </section>

          <div className="km-paper mt-4 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--km-secondary))] text-[18px] font-semibold text-[hsl(var(--km-primary))]" lang="am">ሀ</div>
              <div>
                <p className="text-sm font-bold text-[hsl(var(--km-primary))]" lang="am">በእጅ የተሰራ ውበት</p>
                <p className="mt-0.5 text-xs text-[hsl(var(--km-muted-foreground))]" lang="am">የእያንዳንዱ ቀሚስ ታሪክ ይቀጥላል</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
