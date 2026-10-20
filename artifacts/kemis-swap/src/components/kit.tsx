import { type ReactNode } from "react";
import { Link } from "wouter";
import { AlertTriangle, MapPin, Ruler, Sparkles } from "lucide-react";
import type { Listing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { photoSrc } from "@/lib/kemis";
import { cn } from "@/lib/utils";

export function PageHeader({ title, kicker, action }: { title: string; kicker?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-5 pb-4 rise">
      <div>
        {kicker && <p className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold">{kicker}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-primary" data-testid="text-page-title">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useI18n();
  return (
    <div className="mx-4 my-8 paper rounded-2xl p-6 text-center" role="alert">
      <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" aria-hidden />
      <p className="font-medium">{message ?? t("error")}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry} data-testid="button-retry">{t("retry")}</Button>
      )}
    </div>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mx-4 my-6 overflow-hidden rounded-3xl paper rise">
      <div className="tibeb" aria-hidden />
      <div className="px-6 py-10 text-center">
        <svg viewBox="0 0 80 100" className="mx-auto mb-4 h-24 w-20" aria-hidden>
          <path d="M28 6h24l4 14 14 8-6 12-6-3v57H22V37l-6 3-6-12 14-8z" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
          <path d="M22 80h36M22 86h36" stroke="hsl(var(--accent))" strokeWidth="3" />
          <path d="M40 22v50" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
        <h2 className="font-display text-xl font-semibold text-primary">{title}</h2>
        {sub && <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{sub}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function GridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-secondary" />
          <Skeleton className="h-4 w-3/4 bg-secondary" />
          <Skeleton className="h-3 w-1/2 bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center rounded-full border border-dashed border-primary/60 bg-card/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary", className)} data-testid="badge-demo">
      {t("demo")}
    </span>
  );
}

export function FitBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground", className)}>
      <Ruler className="h-3 w-3" aria-hidden /> {t("compatible")}
    </span>
  );
}

export function ListingCard({ l, index = 0, href }: { l: Listing; index?: number; href?: string }) {
  const { e } = useI18n();
  return (
    <Link href={href ?? `/dress/${l.id}`} className="group block rise" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }} data-testid={`card-listing-${l.id}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
        {l.photos[0] && (
          <img src={photoSrc(l.photos[0])} alt={l.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1.5 tibeb-thin" aria-hidden />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {l.demo && <DemoBadge />}
          {l.compatible && <FitBadge />}
        </div>
        <span className="absolute bottom-3 right-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{e(l.occasion)}</span>
      </div>
      <div className="px-0.5 pt-2">
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold leading-snug">{l.title}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />{l.neighborhood}
          <span aria-hidden>·</span>{e(l.condition)}
        </p>
      </div>
    </Link>
  );
}

export function MeasureTable({ m }: { m: Listing["measurements"] }) {
  const { t } = useI18n();
  const keys = ["bust", "waist", "hips", "shoulder", "length", "sleeves"] as const;
  return (
    <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border">
      {keys.map((k, i) => (
        <div key={k} className={cn("bg-card p-3", i % 3 !== 2 && "border-r", i < 3 && "border-b")}>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{t(k)}</dt>
          <dd className="font-display text-xl font-semibold text-primary" data-testid={`text-measure-${k}`}>
            {m[k]}<span className="ml-0.5 text-xs font-normal text-muted-foreground">{t("cm")}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SafetyNote() {
  const { t } = useI18n();
  return (
    <p className="flex gap-2 rounded-xl bg-secondary/70 p-3 text-xs leading-relaxed text-secondary-foreground tibeb-edge">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      {t("safety")}
    </p>
  );
}
