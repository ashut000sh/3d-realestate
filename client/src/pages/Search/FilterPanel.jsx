// Search filters. Owner: M3.
// Dropdowns apply as soon as they change. Text and prices apply when you press "Apply"
// (so the page doesn't reload results on every key press).
import { useState } from "react";
import { DISTRICTS, LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";

const SELECT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary";

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

  return (
    <form onSubmit={handleApply} className="card space-y-4">
      <Input
        label="Search"
        name="q"
        placeholder="Area or title"
        value={draft.q}
        onChange={(e) => setDraft({ ...draft, q: e.target.value })}
      />

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Type</span>
        <select
          className={SELECT_CLASS}
          value={filters.type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="">Any type</option>
          {Object.values(LISTING_TYPE).map((type) => (
            <option key={type} value={type}>
              {LISTING_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">District</span>
        <select
          className={SELECT_CLASS}
          value={filters.district}
          onChange={(e) => onChange({ district: e.target.value })}
        >
          <option value="">All districts</option>
          {DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min price (Rs.)"
          name="minPrice"
          type="number"
          min="0"
          inputMode="numeric"
          value={draft.minPrice}
          onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
        />
        <Input
          label="Max price (Rs.)"
          name="maxPrice"
          type="number"
          min="0"
          inputMode="numeric"
          value={draft.maxPrice}
          onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply
        </Button>
        <Button type="button" variant="secondary" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
