import { categories } from "../utils/categories";
import "../styles/Main.css";

export default function CategoryFilter({
  selectedCategories,
  setSelectedCategories,
}) {
  const toggleCategory = (key) => {
    if (selectedCategories.includes(key)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== key));
    } else {
      setSelectedCategories([...selectedCategories, key]);
    }
  };

  return (
    <div className="category-filter">
      {categories.map(({ key, icon }) => (
        <button
          key={key}
          className={`category-btn-${key} category-btn ${
            selectedCategories.includes(key) ? "active" : ""
          }`}
          onClick={() => toggleCategory(key)}
        >
          <img
            src={`/assets/icons/${icon.displayName}.svg`}
            alt={icon.displayName}
            style={{
              width: "1.85rem",
              height: "1.85rem",
            }}
          />
        </button>
      ))}
    </div>
  );
}
