import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Show } from "@clerk/react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useGetListing, useGetProfile, getGetListingQueryKey, getGetProfileQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoBadge, ErrorState, FitBadge, MeasureTable, SafetyNote } from "@/components/kit";
import { SafetyActions } from "@/components/safety-actions";
import { useI18n } from "@/lib/i18n";
import { photoSrc } from "@/lib/kemis";
import { cn } from "@/lib/utils";
import { localizedListing } from "@/lib/localized-copy";

function SignedInBits({ listingId, ownerId }: { listingId: string; ownerId: string }) {
  const [, setLocation] = useLocation();
  const { data: me } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  if (!me || me.id === ownerId) return null;
  return <SafetyActions listingId={listingId} userId={ownerId} onBlocked={() => setLocation("/discover")} />;
}

export default function Dress() {
  const { id } = useParams<{ id: string }>();
  const { t, e, lang } = useI18n();
  const [active, setActive] = useState(0);
  const q = useGetListing(id, { query: { queryKey: getGetListingQueryKey(id), enabled: !!id } });
  const l = q.data && localizedListing(q.data,lang);

  if (q.isLoading) return <div className="space-y-3 p-4"><Skeleton className="aspect-[3/4] w-full rounded-3xl bg-secondary" /><Skeleton className="h-8 w-2/3 bg-secondary" /></div>;
  if (q.error || !l) return <ErrorState onRetry={() => q.refetch()} message={q.error?.status === 404 ? t("notFound") : undefined} />;

  return (
    <article className="pb-6 md:grid md:grid-cols-2 md:gap-8 md:p-6">
      <div className="relative">
        <button type="button" onClick={() => history.back()} aria-label={t("back")} className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-card/90" data-testid="button-back">
          <ArrowLeft className="h-5 w-5 text-primary" />
        </button>
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary md:rounded-3xl">
          <img src={photoSrc(l.photos[active])} alt={l.title} className="h-full w-full object-cover" data-testid="img-dress" />
          <div className="absolute inset-x-0 bottom-0 tibeb" />
        </div>
        {l.photos.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 md:px-0">
            {l.photos.map((p, i) => (
              <button key={p + i} type="button" onClick={() => setActive(i)} aria-label={`${t("photos")} ${i + 1}`} data-testid={`button-photo-${i}`}
                className={cn("h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2", i === active ? "border-accent" : "border-transparent opacity-70")}>
                <img src={photoSrc(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-5 px-4 pt-5 md:px-0">
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {l.demo && <DemoBadge />}{l.compatible && <FitBadge />}
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{e(l.occasion)}</span>
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-primary" data-testid="text-dress-title">{l.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />{l.neighborhood} · {t("owner")} <span className="font-medium text-foreground" data-testid="text-owner">{l.ownerName}</span>
          </p>
          {l.demo && <p className="mt-2 rounded-xl border border-dashed border-primary/50 p-3 text-sm">{t("demoNote")}</p>}
        </div>
        <p className="whitespace-pre-line leading-relaxed" data-testid="text-description">{l.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {([["condition", e(l.condition)], ["color", l.color], ["fabric", l.fabric], ["timesWorn", String(l.timesWorn)]] as const).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-card p-3 tibeb-edge"><dt className="text-xs text-muted-foreground">{t(k)}</dt><dd className="font-medium">{v}</dd></div>
          ))}
          <div className="col-span-2 rounded-xl bg-card p-3 tibeb-edge"><dt className="text-xs text-muted-foreground">{t("embroidery")}</dt><dd className="font-medium">{l.embroidery}</dd></div>
        </dl>
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-primary">{t("measurements")}</h2>
          <MeasureTable m={l.measurements} />
        </section>
        <Show when="signed-in">
          <Link href="/discover" className="flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground" data-testid="link-swap-from-detail">{t("discover")}</Link>
          <SignedInBits listingId={l.id} ownerId={l.ownerId} />
        </Show>
        <Show when="signed-out">
          <Link href="/sign-in" className="flex h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground" data-testid="link-signin-detail">{t("signInToSwap")}</Link>
        </Show>
        <SafetyNote />
      </div>
    </article>
  );
}
