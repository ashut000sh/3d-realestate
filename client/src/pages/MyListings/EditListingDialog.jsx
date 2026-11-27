// Pop-up to edit a listing's details (PATCH /api/listings/:id). Owner seller only.
// Only fields that changed are sent.
import { useState } from "react";
import { DISTRICTS, FLOORS, LISTING_TYPE, formatLocalArea } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Dialog from "../../components/Dialog.jsx";
import Input, { Select, Textarea } from "../../components/Input.jsx";
import { updateListing } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL } from "../../utils/formatPrice.js";

const NUMBER_FIELDS = ["price", "bedrooms", "bathrooms", "areaSqft", "floors"];

const asText = (value) => (value === null || value === undefined ? "" : String(value));

export default function EditListingDialog({ listing, onClose, onSaved }) {
  const start = {
    title: listing.title,
    type: listing.type,
    price: asText(listing.price),
    district: listing.district,
    address: asText(listing.address),
    bedrooms: asText(listing.bedrooms),
    bathrooms: asText(listing.bathrooms),
    areaSqft: asText(listing.areaSqft),
    floors: asText(listing.floors ?? 1),
    description: asText(listing.description),
  };
  const [form, setForm] = useState(start);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Send only what changed. Empty optional fields are cleared (null).
    const changes = {};
    for (const key of Object.keys(form)) {
      const value = typeof form[key] === "string" ? form[key].trim() : form[key];
      if (value === asText(start[key]).trim()) continue;
      if (NUMBER_FIELDS.includes(key)) changes[key] = value === "" ? null : Number(value);
      else if (key === "description" || key === "address") changes[key] = value || null;
      else changes[key] = value;
    }
    if (Object.keys(changes).length === 0) return onClose();

    setSaving(true);
    try {
      onSaved(await updateListing(listing.id, changes));
    } catch (err) {
      setErrors({ form: err.message });
      setSaving(false);
    }
  }

  return (
    <Dialog title="Edit listing" onClose={onClose} wide>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Title"
          name="title"
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
          <Input label="Address" name="address" value={form.address} onChange={set("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["bedrooms", "Bedrooms"],
            ["bathrooms", "Bathrooms"],
            ["areaSqft", "Area (sq ft)"],
          ].map(([key, label]) => (
            <Input
              key={key}
              label={label}
              name={key}
              type="number"
              min="0"
              value={form[key]}
              onChange={set(key)}
              error={errors[key]}
              hint={
                key === "areaSqft" && Number(form.areaSqft) > 0
                  ? `≈ ${formatLocalArea(Number(form.areaSqft), form.district)}`
                  : undefined
              }
            />
          ))}
          <Select label="Floors" name="floors" value={form.floors} onChange={set("floors")}>
            {Array.from({ length: FLOORS.MAX - FLOORS.MIN + 1 }, (_, i) => FLOORS.MIN + i).map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ),
            )}
          </Select>
        </div>
        <Textarea
          label="Description"
          name="description"
          rows={4}
          value={form.description}
          onChange={set("description")}
        />
        {errors.form && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {errors.form}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
