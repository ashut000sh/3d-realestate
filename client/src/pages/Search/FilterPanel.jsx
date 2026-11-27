// Search filters. Owner: M3.
// Dropdowns apply as soon as they change. Text and prices apply when you press "Apply"
// (so the page doesn't reload results on every key press).
import { useState } from "react";
import { DISTRICTS, LISTING_TYPE, SQFT_PER, aanaToSqft } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Input, { Select } from "../../components/Input.jsx";
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
    ["", "Any"],
    ...Object.values(LISTING_TYPE).map((t) => [t, LISTING_TYPE_LABEL[t]]),
  ];

  return (
    <form onSubmit={handleApply} className="card space-y-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="filter" className="h-4 w-4 text-accent-dark" /> Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-muted hover:text-danger"
          >
            Clear all
          </button>
        )}
      </div>

      <Input
        label="Keywords"
        name="q"
        icon="search"
        placeholder="Area or title"
        value={draft.q}
        onChange={(e) => setDraft({ ...draft, q: e.target.value })}
      />

      <div>
        <span className="label">Type</span>
        <div className="grid grid-cols-2 gap-1.5">
          {typeOptions.map(([value, label]) => (
            <button
              key={value || "any"}
              type="button"
              onClick={() => onChange({ type: value })}
              aria-pressed={filters.type === value}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                filters.type === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:border-muted/40 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Select
        label="District"
        name="district"
        value={filters.district}
        onChange={(e) => onChange({ district: e.target.value })}
      >
        <option value="">All districts</option>
        {DISTRICTS.map((district) => (
          <option key={district} value={district}>
            {district}
          </option>
        ))}
      </Select>

      <div>
        <span className="label">Price (Rs.)</span>
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="minPrice"
            aria-label="Min price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={draft.minPrice}
            onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
          />
          <Input
            name="maxPrice"
            aria-label="Max price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={draft.maxPrice}
            onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="minArea" className="label mb-0">
            Minimum area
          </label>
          {/* Unit toggle: changes how the box is read (and converts what's typed) */}
          <div
            className="flex rounded-lg border border-border p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Area unit"
          >
            {[
              ["sqft", "sq ft"],
              ["aana", "aana"],
            ].map(([unit, label]) => (
              <button
                key={unit}
                type="button"
                aria-pressed={draft.areaUnit === unit}
                onClick={() => {
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
                }}
                className={`rounded-md px-2 py-1 transition ${
                  draft.areaUnit === unit ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Input
          id="minArea"
          name="minArea"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder={draft.areaUnit === "aana" ? "e.g. 4 aana" : "e.g. 1,000 sq ft"}
          value={draft.minArea}
          onChange={(e) => setDraft({ ...draft, minArea: e.target.value })}
          hint={
            draft.minArea !== "" && Number(draft.minArea) > 0
              ? draft.areaUnit === "aana"
                ? `≈ ${new Intl.NumberFormat("en-IN").format(aanaToSqft(Number(draft.minArea)))} sq ft`
                : `≈ ${Math.round((Number(draft.minArea) / SQFT_PER.aana) * 10) / 10} aana`
              : "Homes without an area are hidden when this is set"
          }
        />
      </div>

      {/* Applies straight away, like the dropdowns */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition hover:border-muted/40">
        <input
          type="checkbox"
          name="verifiedSeller"
          checked={filters.verifiedSeller === "true"}
          onChange={(e) => onChange({ verifiedSeller: e.target.checked ? "true" : "" })}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Icon name="shieldCheck" className="h-4 w-4 text-success" /> Verified sellers only
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Sellers whose documents our team checked in person
          </span>
        </span>
      </label>

      {error && (
        <p
          className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}

      <Button type="submit" className="w-full">
        Apply filters
      </Button>
    </form>
  );
}
