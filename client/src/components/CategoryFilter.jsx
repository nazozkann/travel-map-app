// src/components/CategoryFilter.jsx
import { categories } from "../utils/categories";
import { tags } from "../utils/tags";
import "../styles/Main.css";

export default function CategoryFilter({
  selectedCategories,
  setSelectedCategories,
  selectedTags,
  setSelectedTags,
  isAdding,
  setIsAdding,
  showTags,
  setShowTags,
}) {
  const toggleCategory = (e, key) => {
    e.preventDefault();
    setSelectedCategories((cs) =>
      cs.includes(key) ? cs.filter((c) => c !== key) : [...cs, key]
    );
  };
  const toggleAllCategories = (e) => {
    e.preventDefault();
    setSelectedCategories((sel) =>
      sel.length === categories.length ? [] : categories.map((c) => c.key)
    );
  };

  const toggleTag = (e, key) => {
    e.preventDefault();
    setSelectedTags((ts) =>
      ts.includes(key) ? ts.filter((t) => t !== key) : [...ts, key]
    );
  };
  const toggleAllTags = (e) => {
    e.preventDefault();
    setSelectedTags((sel) =>
      sel.length === tags.length ? [] : tags.map((t) => t.key)
    );
  };

  return (
    <div className="category-filter-container">
      <div className="category-filter">
        {categories.map(({ key, icon }) => (
          <button
            key={key}
            className={`category-btn category-btn-${key} ${
              selectedCategories.includes(key) ? "active" : ""
            }`}
            onClick={(e) => toggleCategory(e, key)}
          >
            <img
              src={`/assets/icons/${icon.displayName}.svg`}
              alt={key}
              style={{ width: "1.85rem", height: "1.85rem" }}
            />
          </button>
        ))}
        <button className="turn-off-all" onClick={toggleAllCategories}></button>
        <button
          onClick={() => setShowTags((prev) => !prev)}
          className="toggle-tags-btn"
        >
          {showTags ? "Hide" : "Show"}
        </button>

        <div
          className={`add-pin-button ${isAdding ? "adding" : ""}`}
          onClick={() => setIsAdding((prev) => !prev)}
          title={isAdding ? "Cancel add-pin mode" : "Enter add-pin mode"}
        >
          {isAdding ? "Cancel" : "+"}
        </div>
      </div>

      {showTags && (
        <div className="category-filter">
          {tags.map(({ key, label }) => (
            <button
              key={key}
              className={`tag tag-${key} ${
                selectedTags.includes(key) ? "active" : ""
              }`}
              onClick={(e) => toggleTag(e, key)}
            >
              {label}
            </button>
          ))}
          <button className="turn-off-all" onClick={toggleAllTags}></button>
        </div>
      )}
    </div>
  );
}
