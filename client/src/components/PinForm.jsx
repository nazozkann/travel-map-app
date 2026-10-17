import { useState } from "react";
import { categories } from "../utils/categories";
import { api } from "../utils/api";
import uploadImage from "../utils/uploadImage";
import TagPicker from "./TagPicker";

async function getCityFromCoords(lat, lon) {
  const key = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (!key) return "Unknown";
  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${key}`
    );
    if (!res.ok) return "Unknown";
    const data = await res.json();
    const props = data.features?.[0]?.properties;
    return props?.city || props?.county || props?.state || "Unknown";
  } catch {
    return "Unknown";
  }
}

export default function PinForm({ lat, lng, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    tags: [],
    image: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "image" ? files[0] || null : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const [city, imageUrl] = await Promise.all([
        getCityFromCoords(lat, lng),
        formData.image ? uploadImage(formData.image) : undefined,
      ]);

      const newPin = await api("/api/pins", {
        method: "POST",
        auth: true,
        body: {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          tags: formData.tags,
          latitude: lat,
          longitude: lng,
          imageUrl,
          city,
        },
      });
      onSuccess(newPin);
    } catch (err) {
      console.error("Pin couldn't be saved:", err);
      setError(err.message || "Couldn't save the pin");
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Title</span>
        <input
          className="input"
          type="text"
          name="title"
          placeholder="e.g. Galata Tower"
          maxLength={120}
          required
          value={formData.title}
          onChange={handleChange}
        />
      </label>

      <div className="field">
        <span className="field-label">Category</span>
        <div className="chip-wrap">
          {categories.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={formData.category === key}
              className={`chip chip-sm chip-cat ${formData.category === key ? "active" : ""}`}
              style={{ "--c": `var(--cat-${key})` }}
              onClick={() => setFormData((prev) => ({ ...prev, category: key }))}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Tags</span>
        <TagPicker
          value={formData.tags}
          onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
        />
      </div>

      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          className="input"
          name="description"
          rows={3}
          placeholder="What makes this place worth a visit?"
          maxLength={5000}
          required
          value={formData.description}
          onChange={handleChange}
        />
      </label>

      <label className="field">
        <span className="field-label">Photo (optional)</span>
        <input
          className="input file-input"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
        />
      </label>

      {error && <p className="error-text">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !formData.category}
        >
          {submitting ? "Saving..." : "Add place"}
        </button>
      </div>
    </form>
  );
}
