// Screen:    Home
// URL:       ROUTES.HOME  ("/home")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 4 Home
// Job:       Featured listings, quick search bar, buy / rent / short-stay tabs.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DISTRICTS, LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import ListingCard, { ListingCardSkeleton } from "../../components/ListingCard.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { searchListings } from "../../services/listings.service.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

const TABS = [
  { type: LISTING_TYPE.SALE, label: "Buy" },
  { type: LISTING_TYPE.RENT, label: "Rent" },
  { type: LISTING_TYPE.SHORT_STAY, label: "Short stay" },
];

const STEPS = [
  {
    icon: "scan",
    title: "We scan the home",
    text: "Our team visits with a LiDAR scanner and captures every room to the centimetre.",
  },
  {
    icon: "cube",
    title: "You walk through it",
    text: "Open the 3D tour in your browser, look around and measure rooms before you visit.",
  },
  {
    icon: "calendar",
    title: "Book with confidence",
    text: "Chat with the seller, then book a viewing or a stay in a couple of taps.",
  },
];

const DISTRICT_NOTES = {
  Kathmandu: "The capital, from Thamel to Budhanilkantha",
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

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [searchType, setSearchType] = useState(LISTING_TYPE.SALE);
  const [district, setDistrict] = useState("");
  const [tab, setTab] = useState(LISTING_TYPE.SALE);

  const featured = useListings(`tab:${tab}`, { type: tab });
  const all = useListings("all", {});
  const tours = all.items.filter((listing) => listing.hasTour);
  const hero = tours.find((l) => l.coverImageUrl) ?? all.items.find((l) => l.coverImageUrl);

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("type", searchType);
    if (district) params.set("district", district);
    navigate(`${ROUTES.SEARCH}?${params}`);
  }

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="grain relative overflow-hidden bg-ink text-white">
        <div className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-primary/50 blur-3xl" />
        <div className="absolute right-0 -bottom-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pt-20 lg:pb-28">
          <div className="animate-fade-up">
            <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <Icon name="sparkle" className="h-3.5 w-3.5 text-accent" /> Nepal's first 3D property
              marketplace
            </p>
            <h1 className="display mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem]">
              Walk through your next home <em className="text-accent not-italic">before</em> you
              visit.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Buy, rent or book a short stay across Kathmandu, Lalitpur, Pokhara and beyond, with
              true-to-scale 3D tours captured by our own team.
            </p>

            {/* Search card */}
            <form
              onSubmit={handleSearch}
              className="mt-9 max-w-2xl rounded-3xl bg-white p-2 text-text shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)]"
            >
              <div className="flex gap-1 p-1" role="tablist" aria-label="What are you looking for">
                {TABS.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    role="tab"
                    aria-selected={searchType === t.type}
                    onClick={() => setSearchType(t.type)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      searchType === t.type
                        ? "bg-ink text-white"
                        : "text-muted hover:bg-sand hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 p-1 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search</span>
                  <Icon
                    name="search"
                    className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Area or title, e.g. Lakeside, Patan"
                    className="h-13 w-full rounded-2xl bg-sand/70 pr-4 pl-12 text-[15px] outline-none placeholder:text-muted/80 focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="relative sm:w-44">
                  <span className="sr-only">District</span>
                  <Icon
                    name="pin"
                    className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted"
                  />
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-13 w-full appearance-none rounded-2xl bg-sand/70 pr-4 pl-12 text-[15px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Anywhere</option>
                    {DISTRICTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <Button type="submit" size="lg" className="rounded-2xl">
                  Search
                </Button>
              </div>
            </form>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              {[
                ["5", "districts covered"],
                ["100%", "homes scanned by our team"],
                ["cm", "accurate measurements"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="display text-3xl text-white">{value}</dt>
                  <dd className="text-white/60">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual */}
          <div className="relative hidden animate-scale-in lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-primary/30 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] ring-1 ring-white/10">
              {hero ? (
                <img
                  src={mediaUrl(hero.coverImageUrl)}
                  alt={hero.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="skeleton h-full w-full rounded-none bg-white/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              {hero && (
                <Link
                  to={buildRoute(ROUTES.LISTING, { id: hero.id })}
                  className="glass absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 rounded-2xl p-4 transition hover:bg-white/20"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{hero.title}</p>
                    <p className="text-sm text-white/70">
                      {hero.district} · {formatPrice(hero.price, hero.type)}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
                    <Icon name="arrowRight" className="h-5 w-5" />
                  </span>
                </Link>
              )}
            </div>
            {/* Floating chips */}
            <div className="absolute top-10 -left-10 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-ink shadow-[var(--shadow-lift)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon name="cube" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Live 3D tour</p>
                <p className="text-xs text-muted">Drag to look around</p>
              </div>
            </div>
            <div className="absolute -right-6 bottom-28 flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-ink shadow-[var(--shadow-lift)]">
              <Icon name="ruler" className="h-4 w-4" /> 4.82 m
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Listings by type ---------- */}
      <section className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Fresh on Aawas</p>
            <h2 className="page-title mt-2">Homes worth a closer look</h2>
          </div>
          <div className="flex items-center gap-3">
            <div
              role="tablist"
              aria-label="Listing type"
              className="flex gap-1 rounded-2xl border border-border bg-surface p-1"
            >
              {TABS.map((t) => (
                <button
                  key={t.type}
                  role="tab"
                  aria-selected={tab === t.type}
                  onClick={() => setTab(t.type)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    tab === t.type ? "bg-primary text-white shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Link
              to={`${ROUTES.SEARCH}?type=${tab}`}
              className="hidden items-center gap-1 text-sm font-semibold text-primary hover:gap-2 sm:flex"
            >
              See all <Icon name="arrowRight" className="h-4 w-4 transition-all" />
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {featured.loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          ) : featured.items.length === 0 ? (
            <EmptyState
              icon="home"
              title="No listings here yet"
              text="Try another tab, or check back soon."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.items.slice(0, 6).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-sand/60">
        <div className="page py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">How Aawas works</p>
            <h2 className="page-title mt-2">From our scanner to your screen</h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card relative overflow-hidden p-7">
                <span className="display absolute -top-4 right-4 text-8xl text-sand">{i + 1}</span>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-accent">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>
                <h3 className="relative mt-6 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="relative mt-2 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- 3D tours ---------- */}
      {tours.length > 0 && (
        <section className="page py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Ready to explore</p>
              <h2 className="page-title mt-2">Step inside in 3D</h2>
            </div>
            <Button to={ROUTES.SEARCH} variant="secondary">
              Explore all homes
            </Button>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {tours.slice(0, 2).map((listing) => (
              <Link
                key={listing.id}
                to={buildRoute(ROUTES.TOUR, { id: listing.id })}
                className="group relative block aspect-[16/10] overflow-hidden rounded-[28px] bg-ink"
              >
                {listing.coverImageUrl && (
                  <img
                    src={mediaUrl(listing.coverImageUrl)}
                    alt={listing.title}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-60"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-xl transition group-hover:scale-110">
                  <Icon name="play" className="ml-1 h-6 w-6" />
                </span>
                <div className="absolute inset-x-6 bottom-6 text-white">
                  <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent uppercase">
                    <Icon name="cube" className="h-3.5 w-3.5" /> 3D tour
                  </p>
                  <p className="display mt-1 text-2xl">{listing.title}</p>
                  <p className="text-sm text-white/70">
                    {listing.district} · {formatPrice(listing.price, listing.type)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Districts ---------- */}
      <section className="page pt-0">
        <p className="eyebrow">Browse by place</p>
        <h2 className="page-title mt-2">Where do you want to live?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DISTRICTS.map((d) => (
            <Link
              key={d}
              to={`${ROUTES.SEARCH}?district=${d}`}
              className="card card-hover group flex flex-col justify-between gap-6 p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon name="pin" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-ink">{d}</span>
                <span className="mt-1 block text-sm leading-snug text-muted">
                  {DISTRICT_NOTES[d]}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Seller CTA ---------- */}
      <section className="page pt-6">
        <div className="grain relative overflow-hidden rounded-[32px] bg-primary px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow text-accent">For owners</p>
              <h2 className="display mt-3 text-3xl leading-tight sm:text-4xl">
                List your property free. We'll scan it and make the 3D tour.
              </h2>
              <p className="mt-4 max-w-xl text-white/75">
                Homes with a 3D tour get serious buyers, fewer wasted viewings and a listing that
                stands out.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button to={ROUTES.SCAN_REQUEST} variant="gold" size="lg">
                List your property <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
