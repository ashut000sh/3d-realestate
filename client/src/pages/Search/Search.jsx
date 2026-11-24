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
import ListingCard from "../../components/ListingCard.jsx";
import Loader from "../../components/Loader.jsx";
import { searchListings } from "../../services/listings.service.js";
import FilterPanel from "./FilterPanel.jsx";
import ResultsMap from "./ResultsMap.jsx";

const FILTER_KEYS = ["q", "type", "district", "minPrice", "maxPrice"];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ items: [], page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read the filters from the URL ("" = not set)
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""]));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const queryKey = searchParams.toString();

  // Load results whenever the URL changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    searchListings({ ...filters, page })
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
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

  return (
    <main className="page">
      <h1 className="page-title mb-6">Search properties</h1>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr_minmax(300px,38%)]">
        <aside>
          <FilterPanel
            filters={filters}
            onChange={updateFilters}
            onClear={() => setSearchParams(new URLSearchParams())}
          />
        </aside>

        <section className="space-y-4">
          {loading ? (
            <Loader label="Searching..." />
          ) : error ? (
            <p className="card text-danger">Couldn't load results: {error}</p>
          ) : (
            <>
              <p className="text-sm text-muted">
                {result.total === 1 ? "1 property found" : `${result.total} properties found`}
              </p>

              {result.items.length === 0 ? (
                <p className="card text-muted">
                  Nothing matches these filters. Try a wider price range or another district.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {result.items.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <nav className="flex items-center justify-between" aria-label="Pages">
                  <Button
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>

        {/* Map: right on big screens, below the results on phones */}
        <section className="lg:sticky lg:top-4 lg:self-start">
          <ResultsMap listings={loading || error ? [] : result.items} />
        </section>
      </div>
    </main>
  );
}
