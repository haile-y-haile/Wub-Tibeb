import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { getGetListingQueryKey, getGetListingsQueryKey, type Listing } from "@workspace/api-client-react";

/** Show a saved listing immediately in every cached list of my listings (incl. paginated keys), then refetch all listing queries. */
export function applySavedListing(qc: QueryClient, l: Listing) {
  qc.setQueryData(getGetListingQueryKey(l.id), l);
  qc.setQueriesData<InfiniteData<Listing[]>>({ queryKey: [...getGetListingsQueryKey({ mine: true }), "pages"] }, (old) => {
    if (!old) return old;
    const exists = old.pages.some((p) => p.some((x) => x.id === l.id));
    const pages = exists ? old.pages.map((p) => p.map((x) => (x.id === l.id ? l : x))) : [[l, ...(old.pages[0] ?? [])], ...old.pages.slice(1)];
    return { ...old, pages };
  });
  // Prefix match: covers ["/api/listings"], every params variant and their "pages" keys.
  void qc.invalidateQueries({ queryKey: getGetListingsQueryKey() });
}
