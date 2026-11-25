// Step 1 of the seller flow: property details + a map click to set the location. Owner: M3.
// Calls onSubmit(form) with the fields for createListing (docs/API.md -> LISTINGS.CREATE).
import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { DISTRICTS, LISTING_TYPE } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";

// Leaflet guesses its image folder from the CSS and puts it in front of these URLs,
// which breaks Vite's file names (the marker shows as a broken image). Turn that off.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const KATHMANDU = [27.7172, 85.324];
const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary";

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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Title"
        name="title"
        placeholder="e.g. 3BHK house in Budhanilkantha"
        value={form.title}
        onChange={set("title")}
        error={errors.title}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Type</span>
          <select className={FIELD_CLASS} value={form.type} onChange={set("type")}>
            {Object.values(LISTING_TYPE).map((type) => (
              <option key={type} value={type}>
                {LISTING_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </label>
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
        <label className="block">
          <span className="mb-1 block text-sm font-medium">District</span>
          <select className={FIELD_CLASS} value={form.district} onChange={set("district")}>
            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
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

      <label htmlFor="description" className="block">
        <span className="mb-1 block text-sm font-medium">Description</span>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={set("description")}
          placeholder="What makes it a good home? Parking, water, road access..."
          className={FIELD_CLASS}
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium">Location on the map</span>
        <p className="mb-2 text-sm text-muted">
          {point
            ? `Marked at ${point[0].toFixed(5)}, ${point[1].toFixed(5)}. Click again to move it.`
            : "Click the map where the property is (optional, but buyers find it more easily)."}
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <MapContainer center={KATHMANDU} zoom={12} className="h-64 w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPlace onPick={setPoint} />
            {point && <Marker position={point} />}
          </MapContainer>
        </div>
      </div>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Save and continue"}
      </Button>
    </form>
  );
}
