import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { LikeConfirm, type LikePair } from "@/components/like-confirm";
import { SmartImg } from "@/lib/low-data";
import { hasFullMeasures } from "@/lib/fit";
import { markOnboard } from "@/lib/onboarding";
import { Link, useLocation } from "wouter";
import { Heart, LayoutGrid, Layers, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProfile, useSwipeDress, getGetListingsQueryKey, getGetProfileQueryKey, getGetMatchesQueryKey,
  type GetListingsParams, type Listing,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DemoBadge, EmptyState, ErrorState, FitBadge, GridSkeleton, ListingCard, PageHeader } from "@/components/kit";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { CONDITIONS, OCCASIONS, errMsg } from "@/lib/kemis";
import { cn } from "@/lib/utils";
import { localizedListing } from "@/lib/localized-copy";
import { useListingPages } from "@/lib/paged-queries";
import { MoreButton } from "@/components/more-button";

function SwipeCard({ l: original, onDecide, disabled }: { l: Listing; onDecide: (d: "like" | "pass") => void; disabled: boolean }) {
  const { t, e, lang } = useI18n();
  const l=localizedListing(original,lang);
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [photo, setPhoto] = useState(0);
  useEffect(() => { setDx(0); setPhoto(0); }, [l.id]);

  const up = () => {
    if (!start.current) return;
    start.current = null;
    if (Math.abs(dx) > 90 && !(disabled && dx > 0)) {
      const dir = dx > 0 ? "like" : "pass";
      setDx(dx > 0 ? 600 : -600);
      setTimeout(() => onDecide(dir), 180);
    } else setDx(0);
  };
  const moved = Math.abs(dx) > 6;

  return (
    <div
      ref={ref}
      className="relative h-full w-full touch-pan-y select-none overflow-hidden rounded-[28px] bg-secondary shadow-[0_18px_40px_-18px_hsl(153_45%_15%/.45)]"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 22}deg)`, transition: start.current ? "none" : "transform .25s ease" }}
      onPointerDown={(ev) => { start.current = { x: ev.clientX, y: ev.clientY }; ref.current?.setPointerCapture(ev.pointerId); }}
      onPointerMove={(ev) => { if (start.current) setDx(ev.clientX - start.current.x); }}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={(ev) => {
        if (moved || l.photos.length < 2) return;
        const r = (ev.currentTarget as HTMLDivElement).getBoundingClientRect();
        setPhoto((p) => (ev.clientX - r.left > r.width / 2 ? Math.min(p + 1, l.photos.length - 1) : Math.max(p - 1, 0)));
      }}
      data-testid={`card-swipe-${l.id}`}
    >
      <SmartImg key={photo} path={l.photos[photo]} alt={l.title} eager className="h-full w-full object-cover" testId={`swipe-photo-${l.id}`} />
      {l.photos.length > 1 && (
        <div className="absolute inset-x-3 top-3 flex gap-1">
          {l.photos.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i === photo ? "bg-card" : "bg-card/40")} />)}
        </div>
      )}
      <div className="absolute left-3 top-6 flex gap-1">{l.demo && <DemoBadge />}{l.compatible && <FitBadge />}</div>
      <div className={cn("absolute right-5 top-14 rotate-12 rounded-lg border-4 border-accent px-3 py-1 font-display text-2xl font-bold text-accent transition-opacity", dx > 40 ? "opacity-100" : "opacity-0")}>{t("like")}</div>
      <div className={cn("absolute left-5 top-14 -rotate-12 rounded-lg border-4 border-card px-3 py-1 font-display text-2xl font-bold text-card transition-opacity", dx < -40 ? "opacity-100" : "opacity-0")}>{t("pass")}</div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(153_40%_8%/.92)] via-[hsl(153_40%_8%/.55)] to-transparent p-5 pt-20 text-[hsl(44_60%_96%)]">
        <div className="tibeb-thin mb-3 w-16 rounded-full" />
        <h2 className="font-display text-2xl font-semibold leading-tight">{l.title}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm opacity-90">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{l.neighborhood}</span>
          <span>{e(l.occasion)}</span><span>{e(l.condition)}</span>
        </p>
        <p className="mt-2 text-xs opacity-80">
          {t("bust")} {l.measurements.bust} · {t("waist")} {l.measurements.waist} · {t("length")} {l.measurements.length} {t("cm")}
        </p>
        <Link href={`/dress/${l.id}`} className="mt-3 inline-block text-xs font-semibold underline underline-offset-4" onClick={(ev) => ev.stopPropagation()} data-testid={`link-details-${l.id}`}>{t("viewDetails")}</Link>
      </div>
    </div>
  );
}

export default function Discover() {
  const { t, e } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"swipe" | "grid">("swipe");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [f, setF] = useState<GetListingsParams>({});
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [offeredId, setOfferedId] = useState<string>(() => localStorage.getItem("kemis-offer") ?? "");
  const [match, setMatch] = useState<string | null>(null);
  const [pair, setPair] = useState<LikePair | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const { userId } = useAuth();

  useEffect(() => { const id = setTimeout(() => setDq(q.trim()), 350); return () => clearTimeout(id); }, [q]);

  const { data: me } = useGetProfile({ query: { queryKey: getGetProfileQueryKey(), retry: false } });
  const params = useMemo<GetListingsParams>(() => {
    const p: GetListingsParams = { ...f };
    // Backend rejects compatible=true without saved preferences; never send it then.
    if (p.compatible && !hasFullMeasures(me?.preferredMeasurements)) delete p.compatible;
    if (dq) p.q = dq;
    (Object.keys(p) as (keyof GetListingsParams)[]).forEach((k) => (p[k] === "" || p[k] === undefined || p[k] === false) && delete p[k]);
    return p;
  }, [f, dq, me?.preferredMeasurements]);
  const listings = useListingPages(params);
  const mine = useListingPages({mine:true});
  const myActive = useMemo(() => (mine.data ?? []).filter((l) => l.status === "active" && !l.demo), [mine.data]);
  const others = useMemo(() => (listings.data ?? []).filter((l) => l.ownerId !== me?.id && l.status !== "hidden"), [listings.data, me?.id]);
  const deck = useMemo(() => others.filter((l) => !seen.has(l.id)), [others, seen]);
  const current = deck[0];

  useEffect(() => {
    if (myActive.length && !myActive.some((l) => l.id === offeredId)) setOfferedId(myActive[0].id);
    if (mine.isSuccess && !myActive.length && offeredId) setOfferedId("");
  }, [myActive, offeredId, mine.isSuccess]);
  useEffect(() => { if (offeredId) localStorage.setItem("kemis-offer", offeredId); }, [offeredId]);

  const swipe = useSwipeDress();
  useEffect(() => { if (seen.size >= 3) markOnboard(userId, { browsed: true }); }, [seen.size, userId]);
  const blockReason = (l?: Listing) => !l ? null : l.demo ? t("likeBlockedDemo") : l.ownerId === me?.id ? t("likeBlockedOwn") : l.status !== "active" ? t("likeBlockedUnavailable") : !offeredId ? t("likeBlockedNoOffer") : null;
  const pass = (l: Listing) => {
    setSeen((s) => new Set(s).add(l.id));
    swipe.mutate({ data: { direction: "pass", targetId: l.id } }, {
      onError: (err) => { setSeen((s) => { const n = new Set(s); n.delete(l.id); return n; }); toast({ title: errMsg(err, t("error")), variant: "destructive" }); },
    });
  };
  // A like never leaves the deck until confirmed: open the dialog with the pair frozen.
  const askLike = (l: Listing) => {
    const offered = myActive.find((x) => x.id === offeredId);
    if (blockReason(l) || !offered) return;
    setLikeError(null);
    setPair(Object.freeze({ target: l, offered }));
  };
  const confirmLike = (p: LikePair) => {
    swipe.mutate({ data: { direction: "like", targetId: p.target.id, offeredId: p.offered.id } }, {
      onSuccess: (r) => {
        setPair(null);
        setSeen((s) => new Set(s).add(p.target.id));
        markOnboard(userId, { liked: true, browsed: true });
        if (r.matched && r.matchId) { setMatch(r.matchId); qc.invalidateQueries({ queryKey: getGetMatchesQueryKey() }); }
        else toast({ title: t("liked") });
      },
      onError: (err) => setLikeError(errMsg(err, t("error"))),
    });
  };
  const decide = (l: Listing, d: "like" | "pass") => (d === "like" ? askLike(l) : pass(l));
  const likeBlocked = !!blockReason(current);
  const prefsMissing = !hasFullMeasures(me?.preferredMeasurements);
  const filtersOn = !!dq || Object.keys(params).length > 0;
  const clearAll = () => { setF({}); setQ(""); setDq(""); };
  const emptyAction = (
    <div className="flex flex-col items-center gap-2">
      {f.compatible && !prefsMissing && <Button className="h-11" onClick={() => setF({ ...f, compatible: undefined })} data-testid="button-empty-show-all">{t("emShowAll")}</Button>}
      {filtersOn && <Button variant="outline" className="h-11" onClick={clearAll} data-testid="button-empty-clear">{t("emClearAll")}</Button>}
    </div>
  );
  const emptyTitle = f.compatible && !prefsMissing ? t("emCompatTitle") : filtersOn ? t("emFilteredTitle") : t("deckEmpty");
  const emptySub = f.compatible && !prefsMissing ? t("emCompatSub") : filtersOn ? t("emFilteredSub") : t("deckEmptySub");
  const activeFilterCount = Object.keys(f).filter((k) => f[k as keyof GetListingsParams]).length;

  const chip = (k: keyof GetListingsParams, opts: string[]) => (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(k as "occasion")}</p>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const on = f[k] === o;
          return (
            <button key={o} type="button" aria-pressed={on} onClick={() => setF({ ...f, [k]: on ? undefined : o })} data-testid={`chip-${k}-${o}`}
              className={cn("min-h-9 rounded-full border px-3 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{e(o)}</button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader kicker={t("tagline")} title={t("discover")} action={
        <div role="tablist" className="flex rounded-full border border-border bg-card p-0.5">
          {([["swipe", Layers, t("swipe")], ["grid", LayoutGrid, t("grid")]] as const).map(([m, I, label]) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} data-testid={`tab-${m}`}
              className={cn("flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <I className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      } />

      <div className="flex gap-2 px-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder={t("search")} aria-label={t("search")} className="h-11 rounded-full bg-card pl-9" data-testid="input-search" />
        </div>
        <Button variant="outline" className="h-11 rounded-full bg-card" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} data-testid="button-filters">
          <SlidersHorizontal className="h-4 w-4" />{activeFilterCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-accent-foreground">{activeFilterCount}</span>}
        </Button>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        <button type="button" aria-pressed={!!f.compatible} onClick={() => setF({ ...f, compatible: f.compatible ? undefined : true })} data-testid="chip-compatible"
          className={cn("min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium", f.compatible ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card")}>{t("compatibleOnly")}</button>
        {OCCASIONS.map((o) => (
          <button key={o} type="button" aria-pressed={f.occasion === o} onClick={() => setF({ ...f, occasion: f.occasion === o ? undefined : o })}
            className={cn("min-h-9 shrink-0 rounded-full border px-3 text-sm", f.occasion === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{e(o)}</button>
        ))}
      </div>

      {f.compatible && prefsMissing && (
        <div className="mx-4 mt-3 rounded-2xl border border-dashed border-accent bg-card p-3 text-sm" role="status" data-testid="notice-compat-noprefs">
          <p>{t("fitFilterNoPrefs")}</p>
          <Link href="/profile" className="mt-2 inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground" data-testid="link-compat-profile">{t("fitAddPrefs")}</Link>
        </div>
      )}

      {showFilters && (
        <div className="mx-4 mt-3 space-y-4 rounded-2xl paper p-4 rise">
          {chip("condition", CONDITIONS)}
          <div className="grid grid-cols-3 gap-2">
            {(["color", "fabric", "neighborhood"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={`f-${k}`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(k)}</label>
                <Input id={`f-${k}`} value={(f[k] as string) ?? ""} onChange={(ev) => setF({ ...f, [k]: ev.target.value || undefined })} className="h-10 bg-background" data-testid={`input-filter-${k}`} />
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={clearAll} data-testid="button-clear-filters">{t("clear")}</Button>
        </div>
      )}

      {mode === "swipe" && (
        <div className="mx-4 mt-4 rounded-2xl border border-dashed border-accent bg-card/70 p-3">
          {mine.isLoading ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : myActive.length === 0 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">{t("needDress")}</p>
              <Link href="/wardrobe?new=1" className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" data-testid="link-add-dress">{t("addDress")}</Link>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("offering")}</p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto" role="radiogroup" aria-label={t("chooseOffer")}>
                {myActive.map((l) => (
                  <button key={l.id} type="button" role="radio" aria-checked={offeredId === l.id} onClick={() => setOfferedId(l.id)} data-testid={`radio-offer-${l.id}`}
                    className={cn("flex shrink-0 items-center gap-2 rounded-full border p-1 pr-3 text-sm", offeredId === l.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                    <SmartImg tiny path={l.photos[0]} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className="max-w-[9rem] truncate">{l.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode==="swipe" && <MoreButton q={mine} label={t("moreOwn")} />}
      <MoreButton q={listings} />
      <div className="mt-4">
        {listings.isLoading ? (mode === "grid" ? <GridSkeleton /> : <div className="mx-auto aspect-[3/4] max-h-[62dvh] w-[calc(100%-2rem)] max-w-sm animate-pulse rounded-[28px] bg-secondary" />)
          : listings.error ? <ErrorState onRetry={() => listings.refetch()} />
          : mode === "grid" ? (
            others.length === 0 ? <EmptyState title={emptyTitle} sub={emptySub} action={emptyAction} /> : (
              <>
                <p className="px-4 pb-2 text-xs text-muted-foreground" data-testid="text-result-count">{others.length} {t("results")}</p>
                <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-4">{others.map((l, i) => <ListingCard key={l.id} l={l} index={i} />)}</div>
              </>
            )
          ) : !current ? (
            others.length > 0 ? (
              <EmptyState title={t("emSeenAll")} sub={t("deckEmptySub")} action={<div className="flex flex-col items-center gap-2"><Button className="h-11" onClick={() => setSeen(new Set())} data-testid="button-deck-restart">{t("emStartOver")}</Button><Button variant="outline" className="h-11" onClick={() => setMode("grid")} data-testid="button-deck-grid">{t("emBrowseGrid")}</Button></div>} />
            ) : <EmptyState title={emptyTitle} sub={emptySub} action={emptyAction} />
          ) : (
            <div className="px-4">
              <div className="relative mx-auto aspect-[3/4] max-h-[62dvh] w-full max-w-sm">
                {deck[1] && <div className="absolute inset-0 translate-y-3 scale-[.95] overflow-hidden rounded-[28px] bg-secondary opacity-70"></div>}
                <SwipeCard key={current.id} l={current} disabled={likeBlocked} onDecide={(d) => decide(current, d)} />
              </div>
              {likeBlocked && <p className="mx-auto mt-3 max-w-sm text-center text-xs text-muted-foreground" data-testid="text-demo-note">{current.demo ? t("demoNote") : blockReason(current)}</p>}
              <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-6">
                <button type="button" onClick={() => decide(current, "pass")} aria-label={t("pass")} data-testid="button-pass"
                  className="grid h-16 w-16 place-items-center rounded-full border-2 border-border bg-card text-muted-foreground active:scale-95"><X className="h-7 w-7" /></button>
                <button type="button" onClick={() => decide(current, "like")} disabled={likeBlocked || swipe.isPending} aria-label={t("like")} data-testid="button-like"
                  className="flex h-16 items-center gap-2 rounded-full bg-primary px-7 font-semibold text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-background active:scale-95 disabled:opacity-40"><Heart className="h-6 w-6" />{t("like")}</button>
              </div>
            </div>
          )}
      </div>

      <LikeConfirm pair={pair} prefs={me?.preferredMeasurements} pending={swipe.isPending} error={likeError} onCancel={() => { setPair(null); setLikeError(null); }} onConfirm={confirmLike} />

      <Dialog open={!!match} onOpenChange={(o) => !o && setMatch(null)}>
        <DialogContent className="overflow-hidden bg-card p-0">
          <div className="tibeb" />
          <div className="p-6 text-center">
            <DialogTitle className="font-display text-3xl text-primary">{t("itsAMatch")}</DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">{t("matchSub")}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button className="h-12" onClick={() => { const id = match; setMatch(null); setLocation(`/matches/${id}`); }} data-testid="button-open-match">{t("openChat")}</Button>
              <Button variant="ghost" onClick={() => setMatch(null)}>{t("keepBrowsing")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
