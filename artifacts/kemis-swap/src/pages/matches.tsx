import { Link } from "wouter";
import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { useGetMatches, useGetProfile, getGetMatchesQueryKey, getGetProfileQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageHeader } from "@/components/kit";
import { useI18n } from "@/lib/i18n";
import { photoSrc } from "@/lib/kemis";
import { useMatchPages } from "@/lib/paged-queries";
import { MoreButton } from "@/components/more-button";

export default function Matches() {
  const { t, e, lang } = useI18n();
  const { data: me } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  const q = useMatchPages();

  return (
    <div>
      <PageHeader kicker={t("tagline")} title={t("matches")} />
      {q.isLoading ? (
        <div className="space-y-3 px-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-secondary" />)}</div>
      ) : q.error ? <ErrorState onRetry={() => q.refetch()} /> : !q.data?.length ? (
        <EmptyState title={t("matchesEmpty")} sub={t("matchesEmptySub")} action={<Link href="/discover" className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">{t("discover")}</Link>} />
      ) : (
        <ul className="space-y-3 px-4">
          {q.data.map((m, i) => {
            const mineIsA = m.dressA.ownerId === me?.id;
            const mine = mineIsA ? m.dressA : m.dressB;
            const hers = mineIsA ? m.dressB : m.dressA;
            return (
              <li key={m.id} className="rise" style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={`/matches/${m.id}`} className="flex items-center gap-3 rounded-2xl paper p-3 tibeb-edge" data-testid={`card-match-${m.id}`}>
                  <div className="flex shrink-0 items-center">
                    <img src={photoSrc(mine.photos[0])} alt="" loading="lazy" className="h-16 w-12 rounded-lg object-cover" />
                    <ArrowLeftRight className="mx-1 h-4 w-4 text-accent" />
                    <img src={photoSrc(hers.photos[0])} alt="" loading="lazy" className="h-16 w-12 rounded-lg object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold">{hers.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{hers.ownerName} · {hers.neighborhood}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary" data-testid={`status-match-${m.id}`}>{e(m.status)}</span>
                      <span className="text-[11px] text-muted-foreground">{new Intl.DateTimeFormat(lang==="am"?"am-ET":"en-GB",{day:"numeric",month:"short"}).format(new Date(m.createdAt))}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <MoreButton q={q} />
    </div>
  );
}
