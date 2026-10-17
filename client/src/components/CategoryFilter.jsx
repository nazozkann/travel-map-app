import { SlidersHorizontal } from "lucide-react";
import { categories } from "../utils/categories";
import TagPicker from "./TagPicker";

// Floating filter bar over a map: category chips plus an optional row of tag chips.
export default function CategoryFilter({
  selectedCategories,
  setSelectedCategories,
  selectedTags,
  setSelectedTags,
  showTags,
  setShowTags,
}) {
  const allSelected = selectedCategories.length === categories.length;

  const toggleCategory = (key) => {
    setSelectedCategories((cs) =>
      cs.includes(key) ? cs.filter((c) => c !== key) : [...cs, key]
    );
  };
  const toggleAllCategories = () => {
    setSelectedCategories(allSelected ? [] : categories.map((c) => c.key));
  };

  return (
    <div className="map-filters">
      <div className="chip-row">
        <button
          type="button"
          aria-pressed={allSelected}
          className={`chip chip-float ${allSelected ? "active" : ""}`}
          onClick={toggleAllCategories}
        >
          All
        </button>
        {categories.map(({ key, label, Icon }) => {
          const active = selectedCategories.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              className={`chip chip-float chip-cat ${active ? "active" : ""}`}
              style={{ "--c": `var(--cat-${key})` }}
              onClick={() => toggleCategory(key)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowTags((prev) => !prev)}
          className={`chip chip-float ${showTags || selectedTags.length ? "active" : ""}`}
          aria-expanded={showTags}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Tags{selectedTags.length > 0 && ` · ${selectedTags.length}`}
        </button>
      </div>

      {showTags && (
        <div className="map-tags">
          <TagPicker value={selectedTags} onChange={setSelectedTags} />
          {selectedTags.length > 0 && (
            <button type="button" className="link small" onClick={() => setSelectedTags([])}>
              Clear tags
            </button>
          )}
        </div>
      )}
    </div>
  );
}
