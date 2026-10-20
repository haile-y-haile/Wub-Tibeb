import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useGetCommunity, useGetListings, getGetCommunityQueryKey, getGetListingsQueryKey } from "@workspace/api-client-react";
import { ErrorState, GridSkeleton, ListingCard, SafetyNote } from "@/components/kit";
import { useI18n } from "@/lib/i18n";
import { basePath } from "@/lib/kemis";

export default function Home() {
  const { t, lang } = useI18n();
  const community = useGetCommunity({ query: { queryKey: getGetCommunityQueryKey() } });
  const listings = useGetListings(undefined, { query: { queryKey: getGetListingsQueryKey() } });
  const c = community.data;

  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-8 pt-6 md:pt-12">
        <div className="grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
          <div className="rise">
            <div className="flex items-baseline gap-3" data-testid="text-brand">
              <span className="wordmark text-xl text-primary">{t("appName")}</span>
              {lang==="en" && <span lang="am" className="wordmark-am text-base text-muted-foreground">ውብ ጥበብ</span>}
            </div>
            <p className="mt-1 font-display text-lg italic text-[#795b25]" data-testid="text-tagline">{t("tagline")}</p>
            <div className="tibeb-thin mt-3 w-24 rounded-full" aria-hidden />
            <h1 className="mt-2 font-display text-[2.6rem] font-semibold leading-[1.02] text-primary md:text-6xl" data-testid="text-hero">{t("heroLine")}</h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">{t("heroSub")}</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground/90">{t("taglineSupport")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/sign-up" className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground" data-testid="link-signup">
                {t("getStarted")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/sign-in" className="inline-flex h-12 items-center rounded-full border border-primary px-6 font-semibold text-primary" data-testid="link-hero-signin">{t("signIn")}</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm rise" style={{ animationDelay: "120ms" }}>
            <div className="grid grid-cols-5 gap-2">
              <img src={`${basePath}/images/kemis-1.webp`} alt={t("exampleTitle")} fetchPriority="high" className="col-span-3 aspect-[3/4] w-full rounded-t-full rounded-b-2xl object-cover" />
              <div className="col-span-2 flex flex-col gap-2 pt-10">
                <img src={`${basePath}/images/kemis-4.webp`} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                <img src={`${basePath}/images/kemis-6.webp`} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
              </div>
            </div>
            <div className="tibeb mt-2 rounded-full" aria-hidden />
          </div>
        </div>
      </section>

      <section className="mx-4 grid grid-cols-3 divide-x divide-border rounded-2xl paper text-center" aria-label={t("community")}>
        {[[c?.dresses, t("dresses")], [c?.swaps, t("swaps")], [c?.neighborhoods, t("hoods")]].map(([n, l], i) => (
          <div key={i} className="px-2 py-4">
            <div className="font-display text-2xl font-semibold text-primary" data-testid={`text-stat-${i}`}>{community.isLoading ? "–" : n ?? 0}</div>
            <div className="text-[11px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </section>
      {listings.data?.some(l=>l.demo) && <p className="px-4 pt-2 text-xs text-muted-foreground">{t("demoCounts")}</p>}

      <section className="px-4 py-10">
        <ol className="grid gap-4 md:grid-cols-3">
          {[[t("how1"), t("how1s")], [t("how2"), t("how2s")], [t("how3"), t("how3s")]].map(([h, s], i) => (
            <li key={i} className="flex gap-4 rounded-2xl paper p-4">
              <span className="font-display text-4xl font-semibold leading-none text-accent">{i + 1}</span>
              <div><h2 className="font-display text-lg font-semibold text-primary">{h}</h2><p className="text-sm text-muted-foreground">{s}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="flex items-end justify-between px-4 pb-3">
          <h2 className="font-display text-2xl font-semibold text-primary">{t("browsePublic")}</h2>
          <Link href="/sign-in" className="text-sm font-semibold text-primary underline underline-offset-4" data-testid="link-signin-to-swap">{t("signInToSwap")}</Link>
        </div>
        {listings.isLoading ? <GridSkeleton /> : listings.error ? <ErrorState onRetry={() => listings.refetch()} /> : (
          <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-4">
            {listings.data?.slice(0, 12).map((l, i) => <ListingCard key={l.id} l={l} index={i} />)}
          </div>
        )}
      </section>
      <div className="px-4 pt-8"><SafetyNote /></div>
    </div>
  );
}
