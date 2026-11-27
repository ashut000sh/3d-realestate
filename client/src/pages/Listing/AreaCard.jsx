// "Area" card on the Listing page: sq ft counting up, the local unit (ropani-aana or
// bigha-kattha-dhur, by district), m², and one floor outline per level.
// <AreaCard areaSqft={1250} district="Kathmandu" floors={2} />
//
// Animation runs once, when the card scrolls into view. With "reduce motion" switched on in the
// device settings, the final numbers and outlines show straight away.
import { useEffect, useRef, useState } from "react";
import { AREA_SYSTEM, areaSystemFor, formatLocalArea, sqftToM2 } from "@realestate/shared";

const COUNT_MS = 900;
const NUMBER = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// An L-shaped floor plan outline. pathLength="1" makes the dash maths independent of size.
const L_SHAPE = "M6 6 H58 V30 H34 V58 H6 Z";

function FloorOutline({ level, drawn, delayMs }) {
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
        <path
          d={L_SHAPE}
          fill="none"
          className="stroke-border"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d={L_SHAPE}
          fill="none"
          className="stroke-accent"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          style={{
            strokeDashoffset: drawn ? 0 : 1,
            transition: `stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
          }}
        />
      </svg>
      <figcaption className="text-xs font-medium text-muted">Level {level}</figcaption>
    </figure>
  );
}

export default function AreaCard({ areaSqft, district, floors = 1 }) {
  const cardRef = useRef(null);
  const reduced = prefersReducedMotion();
  // With reduced motion we start at the end: no effect needs to "set it at once"
  const [shown, setShown] = useState(() => (reduced ? areaSqft : 0));
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    if (reduced) return undefined;
    const card = cardRef.current;
    if (!card) return undefined;
    let frame = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / COUNT_MS);
        setShown(Math.round(areaSqft * easeOutCubic(t)));
        if (t < 1) frame = requestAnimationFrame(tick);
        else setDone(true);
      };
      frame = requestAnimationFrame(tick);
    };

    // Count once, the first time at least 40% of the card is on screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(card);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [areaSqft, reduced]);

  const digits = NUMBER.format(areaSqft).replace(/\D/g, "").length;
  // Big areas (6+ digits) get a smaller number so it never spills out of the card on a phone
  const numberSize =
    digits >= 8
      ? "text-3xl sm:text-4xl"
      : digits >= 6
        ? "text-4xl sm:text-5xl"
        : "text-5xl sm:text-6xl";
  const terai = areaSystemFor(district) === AREA_SYSTEM.BIGHA;
  const levels = Array.from({ length: Math.max(1, Math.min(10, floors || 1)) }, (_, i) => i + 1);

  return (
    <section ref={cardRef} aria-label="Area" className="card overflow-hidden p-6 sm:p-7">
      <p className="eyebrow">Area</p>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-5">
        <div className="min-w-0">
          {/* Screen readers get the final value once, not every animation frame */}
          <p className="sr-only">
            {NUMBER.format(areaSqft)} square feet, about {formatLocalArea(areaSqft, district)},
            about {Math.round(sqftToM2(areaSqft))} square metres
          </p>
          <p aria-hidden="true" className="flex items-baseline gap-2">
            <span
              className={`font-display font-medium tracking-tight text-ink tabular-nums ${numberSize}`}
            >
              {NUMBER.format(shown)}
            </span>
            <span className="text-lg font-medium text-muted">sq ft</span>
          </p>
          <span
            aria-hidden="true"
            className="mt-2 block h-[3px] rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: done ? "3.5rem" : 0 }}
          />
          <p aria-hidden="true" className="mt-3 font-semibold text-accent-dark">
            ≈ {formatLocalArea(areaSqft, district)}
            <span className="ml-2 text-xs font-medium text-muted">
              {terai ? "bigha-kattha-dhur" : "ropani-aana"}
            </span>
          </p>
          <p aria-hidden="true" className="text-sm text-muted">
            ≈ {NUMBER.format(Math.round(sqftToM2(areaSqft)))} m²
          </p>
        </div>

        <div className="ml-auto">
          <p className="mb-2 text-right text-xs font-medium text-muted sm:text-left">
            {levels.length} {levels.length === 1 ? "floor" : "floors"}
          </p>
          <div className="flex flex-wrap justify-end gap-3 sm:justify-start">
            {levels.map((level) => (
              <FloorOutline
                key={level}
                level={level}
                drawn={done}
                delayMs={reduced ? 0 : (level - 1) * 120}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
