// Step 1 of the seller flow: property details + a map click to set the location. Owner: M3.
// Calls onSubmit(form) with the fields for createListing (docs/API.md -> LISTINGS.CREATE).
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DISTRICTS, LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Input, { Select, Textarea } from "../../components/Input.jsx";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";

// Brand-coloured pin instead of Leaflet's default blue marker
const PIN = L.divIcon({
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 34],
  html:
    '<svg width="36" height="36" viewBox="0 0 24 24"><path d="M12 22s-7-6.2-7-11.5A7 7 0 0 1 19 10.5C19 15.8 12 22 12 22Z" ' +
    'fill="#0e2a23" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="10.5" r="2.6" fill="#c39a4b"/></svg>',
});

const KATHMANDU = [27.7172, 85.324];

// Puts the marker where the user clicks
function ClickToPlace({ onPick }) {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

const EMPTY = {
  title: "",
  description: "",
  type: LISTING_TYPE.SALE,
  price: "",
  district: DISTRICTS[0],
  address: "",
  bedrooms: "",
  bathrooms: "",
  areaSqft: "",
};

export default function PropertyForm({ onSubmit, submitting, serverError }) {
  const [form, setForm] = useState(EMPTY);
  const [point, setPoint] = useState(null); // [lat, lng] or null
  const [errors, setErrors] = useState({});

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function validate() {
    const found = {};
    if (form.title.trim().length < 3) found.title = "At least 3 characters";
    if (!(Number(form.price) > 0)) found.price = "Enter a price above 0";
    for (const key of ["bedrooms", "bathrooms", "areaSqft"]) {
      if (form[key] !== "" && !(Number.isInteger(Number(form[key])) && Number(form[key]) >= 0)) {
        found[key] = "Whole number, 0 or more";
      }
    }
    return found;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Only send what was filled in. Numbers go as numbers.
    const toNumber = (value) => (value === "" ? undefined : Number(value));
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      price: Number(form.price),
      district: form.district,
      address: form.address.trim() || undefined,
      bedrooms: toNumber(form.bedrooms),
      bathrooms: toNumber(form.bathrooms),
      areaSqft: toNumber(form.areaSqft),
      lat: point?.[0],
      lng: point?.[1],
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h2 className="display text-2xl text-ink">Tell us about the property</h2>
        <p className="mt-1 text-sm text-muted">
          It's saved as a draft until our team has scanned it.
        </p>
      </div>
      <Input
        label="Title"
        name="title"
        placeholder="e.g. 3BHK house in Budhanilkantha"
        value={form.title}
        onChange={set("title")}
        error={errors.title}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Type" name="type" value={form.type} onChange={set("type")}>
          {Object.values(LISTING_TYPE).map((type) => (
            <option key={type} value={type}>
              {LISTING_TYPE_LABEL[type]}
            </option>
          ))}
        </Select>
        <Input
          label={
            form.type === LISTING_TYPE.RENT
              ? "Rent per month (Rs.)"
              : form.type === LISTING_TYPE.SHORT_STAY
                ? "Price per night (Rs.)"
                : "Price (Rs.)"
          }
          name="price"
          type="number"
          min="0"
          inputMode="numeric"
          value={form.price}
          onChange={set("price")}
          error={errors.price}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="District" name="district" value={form.district} onChange={set("district")}>
          {DISTRICTS.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </Select>
        <Input
          label="Address"
          name="address"
          placeholder="Ward, area, landmark"
          value={form.address}
          onChange={set("address")}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Bedrooms"
          name="bedrooms"
          type="number"
          min="0"
          value={form.bedrooms}
          onChange={set("bedrooms")}
          error={errors.bedrooms}
        />
        <Input
          label="Bathrooms"
          name="bathrooms"
          type="number"
          min="0"
          value={form.bathrooms}
          onChange={set("bathrooms")}
          error={errors.bathrooms}
        />
        <Input
          label="Area (sq ft)"
          name="areaSqft"
          type="number"
          min="0"
          value={form.areaSqft}
          onChange={set("areaSqft")}
          error={errors.areaSqft}
        />
      </div>

      <Textarea
        label="Description"
        id="description"
        name="description"
        rows={4}
        value={form.description}
        onChange={set("description")}
        placeholder="What makes it a good home? Parking, water, road access..."
      />

      <div>
        <span className="label">Location on the map</span>
        <p className="mb-3 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="pin" className="h-4 w-4 shrink-0 text-accent-dark" />
          {point
            ? `Marked at ${point[0].toFixed(5)}, ${point[1].toFixed(5)}. Click again to move it.`
            : "Click the map where the property is (optional, but buyers find it more easily)."}
        </p>
        <div className="overflow-hidden rounded-2xl ring-1 ring-border">
          <MapContainer center={KATHMANDU} zoom={12} className="h-72 w-full cursor-crosshair">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPlace onPick={setPoint} />
            {point && <Marker position={point} icon={PIN} />}
          </MapContainer>
        </div>
      </div>

      {serverError && (
        <p
          className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          <Icon name="alert" className="h-4 w-4" /> {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        {submitting ? "Saving..." : "Save and continue"}
        {!submitting && <Icon name="arrowRight" className="h-4 w-4" />}
      </Button>
    </form>
  );
}
