// Screen:    Tour
// URL:       ROUTES.TOUR  ("/listings/:id/tour")
// Owner:     M1  (see docs/TEAM.md)
// Wireframe: 6-7 3D Tour + Measure
// Job:       Full-screen 3D viewer of the LiDAR scan + measure tool.
//
// The 3D work is in TourViewer.js. This file loads the listing and draws the buttons on top.
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Logo from "../../components/Logo.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getListing } from "../../services/listings.service.js";
import { recordView } from "../../services/stats.service.js";
import { VIEW_KIND } from "@realestate/shared";
import { formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import { TourViewer, formatLength } from "./TourViewer.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

// Uploaded tours live on the API server (/uploads/tours/...). Anything else that starts
// with "/" (like the seed data's /test-tour.glb) is a file in client/public on this site.
function tourFileUrl(tourUrl) {
  if (tourUrl.startsWith("/uploads/")) return mediaUrl(tourUrl);
  return tourUrl;
}

function ToolButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition sm:min-w-20 ${
        active ? "bg-accent text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon name={icon} className="h-5 w-5" />
      {label}
    </button>
  );
}

export default function Tour() {
  const { id } = useParams();
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const [loaded, setLoaded] = useState({ loadedId: null, listing: null, error: "" });
  const listing = loaded.loadedId === id ? loaded.listing : null;
  const pageError = loaded.loadedId === id ? loaded.error : "";

  const [progress, setProgress] = useState(0);
  const [modelState, setModelState] = useState("loading"); // loading | ready | error
  const [measuring, setMeasuring] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [waitingSecondPoint, setWaitingSecondPoint] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  // Seller stats: count this tour open (the server ignores repeats within the hour and the owner)
  useEffect(() => {
    recordView(id, VIEW_KIND.TOUR);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getListing(id)
      .then((data) => !cancelled && setLoaded({ loadedId: id, listing: data, error: "" }))
      .catch(
        (err) =>
          !cancelled &&
          setLoaded({
            loadedId: id,
            listing: null,
            error: err.status === 404 ? "This property doesn't exist." : err.message,
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Start the 3D viewer once we know the tour file
  const tourUrl = listing?.tourUrl;
  useEffect(() => {
    if (!tourUrl || !containerRef.current) return undefined;
    const viewer = new TourViewer(containerRef.current, {
      onProgress: setProgress,
      onLoaded: () => setModelState("ready"),
      onError: () => setModelState("error"),
      onMeasure: (list, waiting) => {
        setMeasurements(list);
        setWaitingSecondPoint(waiting);
      },
    });
    viewer.load(tourFileUrl(tourUrl));
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [tourUrl]);

  function toggleMeasure() {
    const next = !measuring;
    setMeasuring(next);
    viewerRef.current?.setMeasuring(next);
    if (next) {
      setAutoRotate(false);
      viewerRef.current?.setAutoRotate(false);
    }
  }

  function toggleRotate() {
    const next = !autoRotate;
    setAutoRotate(next);
    viewerRef.current?.setAutoRotate(next);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  const backTo = buildRoute(ROUTES.LISTING, { id });

  // ----- no tour / not found -----
  usePageTitle(listing ? `3D tour · ${listing.title}` : "3D tour");

  if (pageError || (listing && !listing.tourUrl)) {
    return (
      <main className="grain flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-accent">
          <Icon name="cube" className="h-8 w-8" />
        </span>
        <h1 className="display mt-6 text-3xl">
          {pageError ? "Tour not available" : "The 3D tour is coming soon"}
        </h1>
        <p className="mt-3 max-w-md text-white/70">
          {pageError ||
            "Our team hasn't scanned this home yet. You can still see the photos and book a viewing."}
        </p>
        <Button to={pageError ? ROUTES.SEARCH : backTo} variant="gold" className="mt-8">
          <Icon name="arrowLeft" className="h-4 w-4" />
          {pageError ? "Explore homes" : "Back to the property"}
        </Button>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0e1714] text-white">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading / error overlay */}
      {(modelState !== "ready" || !listing) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0e1714]">
          {modelState === "error" ? (
            <>
              <Icon name="alert" className="h-10 w-10 text-accent" />
              <p className="display mt-4 text-2xl">We couldn't open this tour</p>
              <p className="mt-2 max-w-sm text-center text-white/60">
                The 3D file is missing or damaged. Please try again later.
              </p>
              <Button to={backTo} variant="gold" className="mt-6">
                Back to the property
              </Button>
            </>
          ) : (
            <>
              <Logo markOnly tone="light" size={56} />
              <p className="mt-6 text-sm tracking-[0.25em] text-white/60 uppercase">
                Preparing tour
              </p>
              <div className="mt-4 h-1 w-56 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{ width: `${Math.max(progress, 6)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/40 tabular-nums">{progress}%</p>
            </>
          )}
        </div>
      )}

      {/* Top bar */}
      {listing && (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
          <Link
            to={backTo}
            className="glass pointer-events-auto flex items-center gap-3 rounded-2xl py-2 pr-4 pl-2 transition hover:bg-white/15"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Icon name="arrowLeft" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block max-w-[52vw] truncate text-sm font-semibold sm:max-w-md">
                {listing.title}
              </span>
              <span className="block text-xs text-white/60">
                {listing.district} · {formatPrice(listing.price, listing.type)}
              </span>
            </span>
          </Link>
          <span className="glass pointer-events-auto hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Live 3D tour
          </span>
        </header>
      )}

      {/* Help card */}
      {modelState === "ready" && showHelp && (
        <div className="glass absolute top-24 left-3 z-20 max-w-xs animate-fade-up rounded-2xl p-4 text-sm sm:left-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">Look around</p>
            <button
              onClick={() => setShowHelp(false)}
              aria-label="Hide tips"
              className="text-white/60 hover:text-white"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2 space-y-1.5 text-white/75">
            <li>Drag to rotate · Right-drag to move</li>
            <li>Scroll or pinch to zoom</li>
            <li>Use Measure, then click two points</li>
          </ul>
        </div>
      )}

      {/* Measurements panel */}
      {(measuring || measurements.length > 0) && modelState === "ready" && (
        <aside className="glass absolute top-24 right-3 z-20 w-64 animate-fade-up rounded-2xl p-4 sm:right-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="ruler" className="h-4 w-4 text-accent" /> Measurements
            </p>
            {measurements.length > 0 && (
              <button
                onClick={() => viewerRef.current?.clearMeasurements()}
                className="text-xs font-semibold text-white/60 hover:text-white"
              >
                Clear all
              </button>
            )}
          </div>
          {measuring && (
            <p className="mt-2 rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs text-accent">
              {waitingSecondPoint
                ? "Now click the second point (Esc to cancel)"
                : "Click the first point on the model"}
            </p>
          )}
          <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
            {measurements.map((m, i) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-sm"
              >
                <span className="text-white/60">#{i + 1}</span>
                <span className="font-semibold tabular-nums">{formatLength(m.meters)}</span>
                <button
                  onClick={() => viewerRef.current?.removeMeasurement(m.id)}
                  aria-label="Remove measurement"
                  className="text-white/50 hover:text-white"
                >
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {measurements.length === 0 && !measuring && (
              <li className="text-xs text-white/50">No measurements yet.</li>
            )}
          </ul>
        </aside>
      )}

      {/* Toolbar */}
      {modelState === "ready" && (
        <nav className="glass absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 animate-fade-up items-center gap-1 rounded-2xl p-1.5 sm:bottom-6">
          <ToolButton icon="ruler" label="Measure" active={measuring} onClick={toggleMeasure} />
          <ToolButton icon="rotate" label="Rotate" active={autoRotate} onClick={toggleRotate} />
          <ToolButton icon="scan" label="Reset" onClick={() => viewerRef.current?.resetView()} />
          <ToolButton icon="expand" label="Full" onClick={toggleFullscreen} />
          <span className="mx-1 h-8 w-px bg-white/15" />
          <Link
            to={buildRoute(ROUTES.BOOKING, { id })}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          >
            <Icon name="calendar" className="h-4 w-4" />
            <span className="hidden sm:inline">Book a visit</span>
          </Link>
        </nav>
      )}
    </main>
  );
}
