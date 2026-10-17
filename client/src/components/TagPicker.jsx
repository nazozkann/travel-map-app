import { tags } from "../utils/tags";

// Toggleable tag chips; a touch-friendly replacement for <select multiple>.
export default function TagPicker({ value, onChange }) {
  const toggle = (key) =>
    onChange(value.includes(key) ? value.filter((t) => t !== key) : [...value, key]);

  return (
    <div className="chip-wrap">
      {tags.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value.includes(key)}
          className={`chip chip-sm ${value.includes(key) ? "active" : ""}`}
          onClick={() => toggle(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
