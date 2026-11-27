// Search filters, as a compact bar above the results (design v2: results first). Owner: M3.
// Always visible: keywords, district, type. Behind "More filters": price, minimum area,
// verified sellers only. Dropdowns, type and the checkbox apply as soon as they change; text,
// prices and area apply with "Apply" (or Enter), so results don't reload on every key press.
import { useState } from "react";
import { DISTRICTS, LISTING_TYPE, SQFT_PER, aanaToSqft } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";

// filters: { q, type, district, minPrice, maxPrice, minArea, verifiedSeller } as strings ("" = not set)
// minArea is always sq ft in the URL and the API. People may type it in aana instead:
// the unit toggle only changes how the box is read, and we convert before applying.
// onChange(changes): merge these changes into the filters (and go back to page 1)
export default function FilterPanel({ filters, onChange, onClear }) {
  const [draft, setDraft] = useState({
    q: filters.q,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minArea: filters.minArea,
    areaUnit: "sqft", // "sqft" | "aana"
  });
  const [error, setError] = useState("");
  const moreCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.minArea,
    filters.verifiedSeller,
  ].filter(Boolean).length;
  const [moreOpen, setMoreOpen] = useState(moreCount > 0);
  // When the URL changes (back/forward, "Clear"), Search.jsx gives this panel a new key,
  // so it starts again with the URL's values. No effect needed to copy them in.

  function handleApply(event) {
    event.preventDefault();
    const min = draft.minPrice === "" ? null : Number(draft.minPrice);
    const max = draft.maxPrice === "" ? null : Number(draft.maxPrice);
    if ((min !== null && min < 0) || (max !== null && max < 0)) {
      return setError("Prices can't be negative");
    }
    if (min !== null && max !== null && min > max) {
      return setError("Min price can't be more than max price");
    }
    const area = draft.minArea === "" ? null : Number(draft.minArea);
    if (area !== null && !(area >= 0)) return setError("Area must be a number, 0 or more");
    setError("");
    const minAreaSqft =
      area === null ? "" : String(draft.areaUnit === "aana" ? aanaToSqft(area) : Math.round(area));
    onChange({
      q: draft.q.trim(),
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      minArea: minAreaSqft,
    });
  }

  function switchUnit(unit) {
    if (unit === draft.areaUnit) return;
    // Keep the same area when switching: 4 aana <-> 1369 sq ft
    const value = draft.minArea === "" ? "" : Number(draft.minArea);
    const converted =
      value === "" || Number.isNaN(value)
        ? draft.minArea
        : unit === "aana"
          ? String(Math.round((value / SQFT_PER.aana) * 10) / 10)
          : String(aanaToSqft(value));
    setDraft({ ...draft, areaUnit: unit, minArea: converted });
  }

  const activeCount = [
    filters.q,
    filters.type,
    filters.district,
    filters.minPrice,
    filters.maxPrice,
    filters.minArea,
    filters.verifiedSeller,
  ].filter(Boolean).length;
  const typeOptions = [
    ["", "Any type"],
    ...Object.values(LISTING_TYPE).map((t) => [t, LISTING_TYPE_LABEL[t]]),
  ];
  const areaHint =
    draft.minArea !== "" && Number(draft.minArea) > 0
      ? draft.areaUnit === "aana"
        ? `≈ ${new Intl.NumberFormat("en-IN").format(aanaToSqft(Number(draft.minArea)))} sq ft`
        : `≈ ${Math.round((Number(draft.minArea) / SQFT_PER.aana) * 10) / 10} aana`
      : "Homes without an area are hidden when this is set";

  return (
    <form onSubmit={handleApply} aria-label="Filters" className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1 lg:max-w-sm">
          <span className="sr-only">Keywords</span>
          <Icon
            name="search"
            className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            placeholder="Area or title"
            className="field h-11 pl-10"
          />
        </label>
        <label>
          <span className="sr-only">District</span>
          <select
            name="district"
            value={filters.district}
            onChange={(e) => onChange({ district: e.target.value })}
            className="field h-11 w-auto pr-9"
          >
            <option value="">All districts</option>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Type</span>
          <select
            name="type"
            value={filters.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="field h-11 w-auto pr-9"
          >
            {typeOptions.map(([value, label]) => (
              <option key={value || "any"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-controls="more-filters"
          className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3.5 text-small font-medium transition-colors ${
            moreOpen || moreCount
              ? "border-primary text-primary"
              : "border-border text-text hover:border-muted/50"
          }`}
        >
          <Icon name="filter" className="h-4 w-4" />
          More filters
          {moreCount > 0 && <span className="tabular-nums">· {moreCount}</span>}
        </button>
        <Button type="submit" className="h-11">
          Apply
        </Button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="h-11 px-2 text-small font-medium text-muted transition-colors hover:text-text"
          >
            Clear all
          </button>
        )}
      </div>

      {moreOpen && (
        <div
          id="more-filters"
          className="mt-5 grid animate-fade-in gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <fieldset>
            <legend className="label mb-1.5 flex min-h-8 items-center">Price (Rs.)</legend>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="minPrice"
                aria-label="Min price"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Min"
                value={draft.minPrice}
                onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                className="field h-11"
              />
              <input
                name="maxPrice"
                aria-label="Max price"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Max"
                value={draft.maxPrice}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                className="field h-11"
              />
            </div>
          </fieldset>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="minArea" className="label mb-0">
                Minimum area
              </label>
              {/* Unit toggle: changes how the box is read (and converts what's typed) */}
              <div className="flex text-small" role="group" aria-label="Area unit">
                {[
                  ["sqft", "sq ft"],
                  ["aana", "aana"],
                ].map(([unit, label]) => (
                  <button
                    key={unit}
                    type="button"
                    aria-pressed={draft.areaUnit === unit}
                    onClick={() => switchUnit(unit)}
                    className={`min-h-8 px-2 font-medium underline-offset-4 transition-colors ${
                      draft.areaUnit === unit
                        ? "text-primary underline decoration-2"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="minArea"
              name="minArea"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder={draft.areaUnit === "aana" ? "e.g. 4 aana" : "e.g. 1,000 sq ft"}
              value={draft.minArea}
              onChange={(e) => setDraft({ ...draft, minArea: e.target.value })}
              className="field h-11"
            />
            <p className="mt-1.5 text-small text-muted">{areaHint}</p>
          </div>

          {/* Applies straight away, like the dropdowns */}
          <label className="flex cursor-pointer items-start gap-3 self-start lg:pt-11">
            <input
              type="checkbox"
              name="verifiedSeller"
              checked={filters.verifiedSeller === "true"}
              onChange={(e) => onChange({ verifiedSeller: e.target.checked ? "true" : "" })}
              className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block text-small font-medium text-text">Verified sellers only</span>
              <span className="block max-w-56 text-small text-muted">
                Documents checked in person by our team
              </span>
            </span>
          </label>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-2 text-small text-danger" role="alert">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}
    </form>
  );
}
