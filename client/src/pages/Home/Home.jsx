// Screen:    Home
// URL:       ROUTES.HOME  ("/home")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 4 Home
// Job:       Featured listings, quick search bar, buy / rent / short-stay tabs.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import ListingCard from "../../components/ListingCard.jsx";
import Loader from "../../components/Loader.jsx";
import { ROUTES } from "../../constants/routes.js";
import { searchListings } from "../../services/listings.service.js";

const TABS = [
  { type: LISTING_TYPE.SALE, label: "Buy" },
  { type: LISTING_TYPE.RENT, label: "Rent" },
  { type: LISTING_TYPE.SHORT_STAY, label: "Short stay" },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState(LISTING_TYPE.SALE);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load listings for the chosen tab. "cancelled" stops an old tab's answer
  // from replacing a newer one if the user switches tabs quickly.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    searchListings({ type, page: 1 })
      .then((data) => !cancelled && setListings(data.items))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [type]);

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("type", type);
    navigate(`${ROUTES.SEARCH}?${params}`);
  }

  return (
    <main>
      {/* Hero with the quick search bar */}
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-xl text-3xl font-semibold sm:text-4xl">
            Walk through homes in Nepal before you visit
          </h1>
          <p className="mt-3 max-w-xl text-white/80">
            Buy, rent or book a short stay. Many listings have a 3D tour you can open in your
            browser.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex max-w-2xl flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-3 text-text sm:flex-row sm:items-end"
          >
            <Input
              name="q"
              aria-label="Search"
              placeholder="Search by area or title, e.g. Lalitpur, Lakeside"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="sm:py-2">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="page space-y-6">
        {/* Buy / Rent / Short stay tabs */}
        <div role="tablist" aria-label="Listing type" className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.type}
              role="tab"
              aria-selected={type === tab.type}
              onClick={() => setType(tab.type)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                type === tab.type
                  ? "bg-primary text-white"
                  : "border border-border bg-surface hover:bg-background"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            to={`${ROUTES.SEARCH}?type=${type}`}
            className="ml-auto self-center text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        </div>

        {/* Listings grid */}
        {loading ? (
          <Loader label="Loading listings..." />
        ) : error ? (
          <p className="card text-danger">Couldn't load listings: {error}</p>
        ) : listings.length === 0 ? (
          <p className="card text-muted">No listings here yet. Try another tab.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Banner for sellers */}
        <section className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Have a property?</h2>
            <p className="text-muted">
              List it for free. Our team comes to scan it and makes a 3D tour for buyers.
            </p>
          </div>
          <Link
            to={ROUTES.SCAN_REQUEST}
            className="rounded-lg bg-primary px-4 py-2 text-center font-medium text-white transition hover:bg-primary-dark"
          >
            List your property
          </Link>
        </section>
      </div>
    </main>
  );
}
