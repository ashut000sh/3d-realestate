// Search filters. Owner: M3.
// Dropdowns apply as soon as they change. Text and prices apply when you press "Apply"
// (so the page doesn't reload results on every key press).
import { useState } from "react";
import { DISTRICTS, LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Input, { Select } from "../../components/Input.jsx";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";

// filters: { q, type, district, minPrice, maxPrice } as strings ("" = not set)
// onChange(changes): merge these changes into the filters (and go back to page 1)
export default function FilterPanel({ filters, onChange, onClear }) {
  const [draft, setDraft] = useState({
    q: filters.q,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
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
    setError("");
    onChange({ q: draft.q.trim(), minPrice: draft.minPrice, maxPrice: draft.maxPrice });
  }

  const activeCount = [
    filters.q,
    filters.type,
    filters.district,
    filters.minPrice,
    filters.maxPrice,
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
