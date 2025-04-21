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
      {categories.map(({ key, icon: Icon }) => (
        <button
          key={key}
          className={`category-btn-${key} category-btn ${
            selectedCategories.includes(key) ? "active" : ""
          }`}
          onClick={() => toggleCategory(key)}
        >
          <Icon className="category-icon" size={16} />
        </button>
      ))}
    </div>
  );
}
