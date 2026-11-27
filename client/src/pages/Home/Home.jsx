// Screen:    Home
// URL:       ROUTES.HOME  ("/home")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 4 Home
// Job:       Featured listings, quick search bar, buy / rent / short-stay tabs.
//
// Design v2 (docs/design): one idea per section. The hero says what Aawas is and lets you search;
// the photos do the selling. No gradients, no stat boxes, no card-per-feature sections.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DISTRICTS, LISTING_TYPE } from "@realestate/shared";
import { HouseKeys, ScanRoom } from "../../assets/illustrations/index.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import ListingCard, { ListingCardSkeleton } from "../../components/ListingCard.jsx";
import Photo from "../../components/Photo.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { searchListings } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

const TABS = [
  { type: LISTING_TYPE.SALE, label: "Buy" },
  { type: LISTING_TYPE.RENT, label: "Rent" },
  { type: LISTING_TYPE.SHORT_STAY, label: "Short stay" },
];

const STEPS = [
  {
    title: "We scan the home",
    text: "Our team visits with a LiDAR scanner and captures every room to the centimetre.",
  },
  {
    title: "You walk through it",
    text: "Open the 3D tour in your browser, look around and measure rooms before you visit.",
  },
  {
    title: "You book with confidence",
    text: "Chat with the seller, then book a viewing or a stay in a couple of taps.",
  },
];

const DISTRICT_NOTES = {
  Kathmandu: "From Thamel to Budhanilkantha",
  Lalitpur: "Patan's heritage lanes and quiet suburbs",
  Bhaktapur: "Newari homes near the old city",
  Kaski: "Lakeside living in Pokhara",
  Chitwan: "Space, greenery and jungle lodges",
};

// Loads listings for a key. `loading` is worked out from the key (not set inside the effect).
function useListings(key, filters) {
  const [state, setState] = useState({ key: null, items: [], error: "" });
  useEffect(() => {
    let cancelled = false;
    searchListings({ ...filters, page: 1 })
      .then((data) => !cancelled && setState({ key, items: data.items, error: "" }))
      .catch((err) => !cancelled && setState({ key, items: [], error: err.message }));
    return () => {
      cancelled = true;
    };
    // key describes the filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const fresh = state.key === key;
  return { items: fresh ? state.items : [], error: fresh ? state.error : "", loading: !fresh };
}

// Text tabs with a short underline for the active one (no filled pills)
function TypeTabs({ value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 border-b border-border">
      {TABS.map((t) => (
        <button
          key={t.type}
          type="button"
          role="tab"
          aria-selected={value === t.type}
          onClick={() => onChange(t.type)}
          className={`-mb-px border-b-2 pb-2.5 text-small font-medium transition-colors ${
            value === t.type
              ? "border-primary text-text"
              : "border-transparent text-muted hover:text-text"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [searchType, setSearchType] = useState(LISTING_TYPE.SALE);
  const [district, setDistrict] = useState("");
  const [tab, setTab] = useState(LISTING_TYPE.SALE);

  const featured = useListings(`tab:${tab}`, { type: tab });
  const all = useListings("all", {});
  const hero =
    all.items.find((l) => l.hasTour && l.coverImageUrl) ?? all.items.find((l) => l.coverImageUrl);
  const homesIn = (d) => all.items.filter((l) => l.district === d).length;
  // Whole rows only on a 3-column grid: no lonely last card
  // The hero home is already shown big above: don't repeat it right below
  const pool = featured.items.filter((l) => l.id !== hero?.id);
  const shown =
    pool.length > 3 ? pool.slice(0, Math.floor(Math.min(6, pool.length) / 3) * 3) : pool;

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("type", searchType);
    if (district) params.set("district", district);
    navigate(`${ROUTES.SEARCH}?${params}`);
  }

  usePageTitle(null);

  return (
    <main>
      {/* ---------- Hero: what Aawas is, and a way in ---------- */}
      <section className="mx-auto grid max-w-[75rem] items-center gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-8 lg:pt-16 lg:pb-24">
        <div>
          <h1 className="font-display text-[2.25rem] leading-[1.08] font-medium tracking-[-0.03em] text-ink sm:text-display">
            Walk through your next home{" "}
            <span className="underline decoration-accent decoration-2 underline-offset-[0.18em]">
              before
            </span>{" "}
            you visit.
          </h1>
          <p className="mt-5 max-w-md text-body text-muted sm:text-[1.0625rem] sm:leading-7">
            Homes to buy, rent or stay in across Nepal, each with a true-to-scale 3D tour our own
            team scanned in person.
          </p>

          <form onSubmit={handleSearch} className="mt-8" role="search">
            <TypeTabs
              value={searchType}
              onChange={setSearchType}
              label="What are you looking for"
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Area or title</span>
                <Icon
                  name="search"
                  className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Lakeside, Patan, Baluwatar…"
                  className="field h-12 pl-10"
                />
              </label>
              <label className="sm:w-40">
                <span className="sr-only">District</span>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="field h-12 appearance-none"
                >
                  <option value="">Anywhere</option>
                  {DISTRICTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <Button type="submit" size="lg">
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* The featured home, large, with a quiet caption under the photo */}
        <figure className="min-w-0">
          <Link
            to={hero ? buildRoute(ROUTES.LISTING, { id: hero.id }) : ROUTES.SEARCH}
            className="block aspect-[4/3] overflow-hidden rounded-xl bg-sand lg:aspect-[5/4]"
            aria-label={hero ? `${hero.title}, view this home` : "Explore homes"}
          >
            {hero && (
              <Photo
                src={mediaUrl(hero.coverImageUrl)}
                alt={hero.title}
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            )}
          </Link>
          {hero && (
            <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-small">
              <span className="text-muted">
                <span className="font-medium text-text">{hero.title}</span> · {hero.district} ·{" "}
                {formatPrice(hero.price, hero.type)}
              </span>
              {hero.hasTour && (
                <Link
                  to={buildRoute(ROUTES.TOUR, { id: hero.id })}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:gap-1.5"
                >
                  Open its 3D tour
                  <Icon name="arrowRight" className="h-4 w-4 transition-all" />
                </Link>
              )}
            </figcaption>
          )}
        </figure>
      </section>

      {/* ---------- Featured homes ---------- */}
      <section className="mx-auto max-w-[75rem] px-4 pb-24 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h2 className="page-title">Homes worth a closer look</h2>
          <Link
            to={`${ROUTES.SEARCH}?type=${tab}`}
            className="inline-flex items-center gap-1 text-small font-medium text-primary hover:gap-1.5"
          >
            See all {LISTING_TYPE_LABEL[tab]?.toLowerCase()}
            <Icon name="arrowRight" className="h-4 w-4 transition-all" />
          </Link>
        </div>
        <div className="mt-6 max-w-sm">
          <TypeTabs value={tab} onChange={setTab} label="Listing type" />
        </div>

        <div className="mt-8">
          {featured.loading ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : featured.error ? (
            <EmptyState
              icon="alert"
              tone="danger"
              title="Couldn't load listings"
              text={featured.error}
            />
          ) : shown.length === 0 ? (
            <EmptyState
              icon="home"
              title="No listings here yet"
              text="Try another tab, or check back soon."
            />
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-[75rem] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-24">
          <div>
            <h2 className="page-title max-w-sm">From our scanner to your screen</h2>
            <ScanRoom className="mt-10 w-full max-w-sm" />
          </div>
          <ol className="divide-y divide-border">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6 first:pt-0">
                <span className="font-display text-heading text-accent-ink tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-heading font-semibold text-text">{step.title}</h3>
                  <p className="mt-1.5 max-w-md text-body text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Districts ---------- */}
      <section className="mx-auto max-w-[75rem] px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="page-title">Where do you want to live?</h2>
        <ul className="mt-8 grid border-t border-border sm:grid-cols-2 lg:grid-cols-5">
          {DISTRICTS.map((d) => (
            <li key={d} className="border-b border-border lg:border-r lg:last:border-r-0">
              <Link
                to={`${ROUTES.SEARCH}?district=${d}`}
                className="group flex h-full flex-col gap-1 py-5 transition-colors lg:px-5 lg:first:pl-0"
              >
                <span className="font-display text-heading text-ink group-hover:text-primary">
                  {d}
                </span>
                <span className="text-small text-muted">{DISTRICT_NOTES[d]}</span>
                {!all.loading && (
                  <span className="mt-2 text-small font-medium text-text tabular-nums">
                    {homesIn(d)} {homesIn(d) === 1 ? "home" : "homes"}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- For owners ---------- */}
      <section className="mx-auto max-w-[75rem] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 border-t border-border pt-16 md:grid-cols-[1fr_auto] md:gap-16">
          <div className="max-w-xl">
            <h2 className="page-title">List your property free. We'll scan it for you.</h2>
            <p className="mt-4 text-body text-muted">
              Homes with a 3D tour get serious buyers and fewer wasted viewings. Our team visits,
              scans every room and publishes the tour with your listing.
            </p>
            <Button to={ROUTES.SCAN_REQUEST} size="lg" className="mt-8">
              List your property
            </Button>
          </div>
          <HouseKeys className="w-56 md:w-72" />
        </div>
      </section>
    </main>
  );
}
