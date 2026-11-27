// Screen:    Search
// URL:       ROUTES.SEARCH  ("/search")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 5 Search + Filters
// Job:       Filters (type, price, district) + results list + Leaflet map. Calls LISTINGS.LIST.
//
// All filters live in the URL (?q=&type=&district=&minPrice=&maxPrice=&page=),
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

const FILTER_KEYS = ["q", "type", "district", "minPrice", "maxPrice", "minArea"];

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
    <main className="page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Explore</p>
          <h1 className="page-title mt-2">
            {filters.district ? `Homes in ${filters.district}` : "Find your place in Nepal"}
          </h1>
        </div>
        {!loading && !error && (
          <p className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-muted ring-1 ring-border">
            <span className="font-semibold text-ink">{result.total}</span>{" "}
            {result.total === 1 ? "home" : "homes"} found
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_minmax(320px,34%)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <FilterPanel
            // Back/forward or "Clear" changes the URL: a new key resets the text boxes to match
            key={`${filters.q}|${filters.minPrice}|${filters.maxPrice}|${filters.minArea}`}
            filters={filters}
            onChange={updateFilters}
            onClear={() => setSearchParams(new URLSearchParams())}
          />
        </aside>

        <section className="min-w-0 space-y-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <EmptyState icon="alert" tone="danger" title="Couldn't load results" text={error} />
          ) : result.items.length === 0 ? (
            <EmptyState
              icon="search"
              title="No homes match these filters"
              text="Try a wider price range, another district or fewer words in the search box."
              action={
                <Button variant="secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {result.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <nav
              className="flex items-center justify-between rounded-2xl bg-surface p-2 ring-1 ring-border"
              aria-label="Pages"
            >
              <Button variant="ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <Icon name="chevronLeft" className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-muted">
                Page <span className="font-semibold text-ink">{page}</span> of {totalPages}
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

        {/* Map: right on big screens, below the results on smaller ones */}
        <section className="lg:col-span-2 xl:sticky xl:top-24 xl:col-span-1 xl:self-start">
          <ResultsMap listings={loading || error ? [] : result.items} />
        </section>
      </div>
    </main>
  );
}
