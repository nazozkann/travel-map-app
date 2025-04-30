import { categories } from "../utils/categories";
import "../styles/Main.css";

export default function CategoryFilter({
  selectedCategories,
  setSelectedCategories,
  isAdding,
  setIsAdding,
}) {
  const toggleCategory = (e, key) => {
    e.preventDefault();
    if (selectedCategories.includes(key)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== key));
    } else {
      setSelectedCategories([...selectedCategories, key]);
    }
  };

  const handleToggleAll = (e) => {
    e.preventDefault();
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map((cat) => cat.key));
    }
  };

  return (
    <div className="category-filter-container">
      <div className="category-filter">
        {categories.map(({ key, icon }) => (
          <button
            key={key}
            className={`category-btn-${key} category-btn ${
              selectedCategories.includes(key) ? "active" : ""
            }`}
            onClick={(e) => toggleCategory(e, key)}
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
        <button
          className="turn-off-all"
          onClick={(e) => handleToggleAll(e)}
        ></button>
      </div>
      <div className="category-filter">
        <div
          className="add-pin-button"
          style={isAdding ? {} : { fontWeight: "800", fontSize: "1rem" }}
          onClick={() => setIsAdding((prev) => !prev)}
        >
          {isAdding ? "Cancel" : "+"}
        </div>
      </div>
    </div>
  );
}
