import { useState } from "react";
import { categories } from "../utils/categories";
import { tags } from "../utils/tags";
import { api } from "../utils/api";
import uploadImage from "../utils/uploadImage";
import "../styles/Main.css";

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

export default function PinForm({ lat, lng, onSuccess }) {
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

  function handleTagsChange(e) {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, tags: selected }));
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
      console.error("⛔ Pin kaydedilemedi:", err);
      setError(err.message || "Couldn't save the pin");
      setSubmitting(false);
    }
  }

  return (
    <form id="pin-form" className="pin-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        placeholder="title"
        maxLength={120}
        required
        onChange={handleChange}
      />
      <select
        name="category"
        id="pin-category"
        required
        value={formData.category}
        onChange={handleChange}
      >
        <option value="">Select category</option>
        {categories.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>
      <label>
        Tags
        <select
          name="tags"
          multiple
          value={formData.tags}
          onChange={handleTagsChange}
        >
          {tags.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <textarea
        name="description"
        placeholder="description"
        maxLength={5000}
        required
        onChange={handleChange}
      ></textarea>
      <input
        className="file-input"
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
      />
      {error && <p className="error-text">{error}</p>}
      <button id="form-submit" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Submit"}
      </button>
    </form>
  );
}
