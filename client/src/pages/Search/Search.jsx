// Screen:    Search
// URL:       ROUTES.SEARCH  ("/search")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 5 Search + Filters
// Job:       Filters (type, price, district) + results list + Leaflet map. Calls LISTINGS.LIST.
//
// All filters live in the URL (?q=&type=&district=&minPrice=&maxPrice=&verifiedSeller=&page=),
// so a search can be shared as a link and survives a page refresh.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LIMITS } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import ListingCard, { ListingCardSkeleton } from "../../components/ListingCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { searchListings } from "../../services/listings.service.js";
import FilterPanel from "./FilterPanel.jsx";
import ResultsMap from "./ResultsMap.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { NoResults } from "../../assets/illustrations/index.jsx";

const FILTER_KEYS = ["q", "type", "district", "minPrice", "maxPrice", "minArea", "verifiedSeller"];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  // loadedKey = which URL the result/error belong to. While it differs from the
  // current URL we are loading (worked out here, not set inside the effect).
  const [loaded, setLoaded] = useState({
    loadedKey: null,
    result: { items: [], page: 1, total: 0 },
    error: "",
  });

  // Read the filters from the URL ("" = not set)
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""]));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const queryKey = searchParams.toString();
  const { result, error } = loaded;
  const loading = loaded.loadedKey !== queryKey;
  const [hoveredId, setHoveredId] = useState(null); // card <-> map pin highlight

  // Load results whenever the URL changes
  useEffect(() => {
    let cancelled = false;
    searchListings({ ...filters, page })
      .then((data) => !cancelled && setLoaded({ loadedKey: queryKey, result: data, error: "" }))
      .catch(
        (err) =>
          !cancelled &&
          setLoaded((prev) => ({ loadedKey: queryKey, result: prev.result, error: err.message })),
      );
    return () => {
      cancelled = true;
    };
    // queryKey covers every filter and the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Write new filter values into the URL. Any filter change goes back to page 1.
  function updateFilters(changes) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value === undefined || value === null) next.delete(key);
      else next.set(key, value);
    });
    next.delete("page");
    setSearchParams(next);
  }

  function goToPage(newPage) {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = Math.max(1, Math.ceil(result.total / LIMITS.PAGE_SIZE));

  usePageTitle("Explore homes");

  return (
    <main className="mx-auto w-full max-w-[75rem] px-4 pt-8 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="page-title">
          {filters.district ? `Homes in ${filters.district}` : "Find your place in Nepal"}
        </h1>
        <p className="text-small text-muted" aria-live="polite">
          {loading ? (
            "Searching…"
          ) : error ? null : (
            <>
              <span className="font-semibold text-text tabular-nums">{result.total}</span>{" "}
              {result.total === 1 ? "home" : "homes"}
            </>
          )}
        </p>
      </div>

      <div className="mt-6">
        <FilterPanel
          // Back/forward or "Clear" changes the URL: a new key resets the text boxes to match
          key={`${filters.q}|${filters.minPrice}|${filters.maxPrice}|${filters.minArea}`}
          filters={filters}
          onChange={updateFilters}
          onClear={() => setSearchParams(new URLSearchParams())}
        />
      </div>

      {/* Results and map share the page: list left, map right (map under the list on phones) */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]">
        <section className="min-w-0" aria-label="Results">
          {loading ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon="alert" tone="danger" title="Couldn't load results" text={error} />
          ) : result.items.length === 0 ? (
            <EmptyState
              illustration={NoResults}
              title="No homes match these filters"
              text="Try a wider price range, another district or fewer words in the search box."
              action={
                <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            // key = the search: a new search fades its results in (none with reduced motion)
            <div key={queryKey} className="grid animate-fade-in gap-x-6 gap-y-10 sm:grid-cols-2">
              {result.items.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  highlighted={hoveredId === listing.id}
                  onHover={setHoveredId}
                />
              ))}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <nav
              className="mt-12 flex items-center justify-between border-t border-border pt-4"
              aria-label="Pages"
            >
              <Button variant="ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <Icon name="chevronLeft" className="h-4 w-4" /> Previous
              </Button>
              <span className="text-small text-muted">
                Page <span className="font-semibold text-text">{page}</span> of {totalPages}
              </span>
              <Button
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next <Icon name="chevronRight" className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </section>

        <section aria-label="Map" className="lg:sticky lg:top-24 lg:self-start">
          <ResultsMap
            listings={loading || error ? [] : result.items}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            className="h-80 lg:h-[calc(100vh-8rem)]"
          />
        </section>
      </div>
    </main>
  );
}
