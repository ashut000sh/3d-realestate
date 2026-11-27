// Screen:    Saved
// URL:       ROUTES.SAVED  ("/saved")
// Job:       The homes the user saved with the heart button. Logged-in users only.
import { useEffect, useState } from "react";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import ListingCard, { ListingCardSkeleton } from "../../components/ListingCard.jsx";
import { ROUTES } from "../../constants/routes.js";
import { useSaved } from "../../hooks/useSaved.js";
import { getSaved } from "../../services/saved.service.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export default function Saved() {
  const { ids } = useSaved();
  const [result, setResult] = useState({ items: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    getSaved()
      .then((items) => !cancelled && setResult({ items, error: "" }))
      .catch((err) => !cancelled && setResult({ items: [], error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Un-hearting a card here removes it straight away
  const items = result.items?.filter((listing) => ids.has(listing.id)) ?? null;

  usePageTitle("Saved homes");

  return (
    <main className="page space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your shortlist</p>
          <h1 className="page-title mt-2">Saved homes</h1>
        </div>
        {items?.length > 0 && (
          <p className="text-sm text-muted">
            {items.length} {items.length === 1 ? "home" : "homes"}
          </p>
        )}
      </header>

      {result.error ? (
        <EmptyState
          icon="alert"
          tone="danger"
          title="Couldn't load your saved homes"
          text={result.error}
        />
      ) : items === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="heart"
          title="No saved homes yet"
          text="Tap the heart on any home to keep it here and come back to it later."
          action={
            <Button to={ROUTES.SEARCH}>
              <Icon name="search" className="h-4 w-4" /> Browse homes
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
