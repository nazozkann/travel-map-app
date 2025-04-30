import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Main.css";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
import { categories } from "../utils/categories";

function wilsonScore(likes, dislikes) {
  const n = likes + dislikes;
  if (n === 0) return 0;
  const z = 1.96;
  const p = likes / n;
  return (
    (p +
      (z * z) / (2 * n) -
      z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  );
}

export default function BestPlaces() {
  const [pins, setPins] = useState([]);
  const [view, setView] = useState(null);
  const [lists, setLists] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );

  useEffect(() => {
    fetch("http://localhost:8000/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data
          .slice()
          .sort(
            (a, b) =>
              wilsonScore(b.likes, b.dislikes) -
              wilsonScore(a.likes, a.dislikes)
          );
        setPins(sorted);
      });

    fetch("http://localhost:8000/api/lists/all")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data
          .slice()
          .sort((a, b) => (b.pins?.length || 0) - (a.pins?.length || 0)); // En çok pinli listeler en üstte
        setLists(sorted);
      });
    setView("places");
  }, []);
  const filteredPins = pins.filter((pin) =>
    selectedCategories.includes(pin.category)
  );

  function toggleCategory(catKey) {
    setSelectedCategories((prev) =>
      prev.includes(catKey)
        ? prev.filter((c) => c !== catKey)
        : [...prev, catKey]
    );
  }
  function toggleAllCategories() {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([categories[0].key]);
    } else {
      setSelectedCategories(categories.map((cat) => cat.key));
    }
  }

  if (view === null) return <p>Loading...</p>;
  return (
    <div className="places-container">
      <div className="places-tabs">
        <button
          className={`tab ${view === "places" ? "active" : ""}`}
          onClick={() => setView("places")}
        >
          Places
        </button>
        <button
          className={`tab ${view === "lists" ? "active" : ""}`}
          onClick={() => setView("lists")}
        >
          Lists
        </button>
      </div>

      {view === "places" && (
        <div className="category-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`category-btn-${cat.key} category-btn-small ${
                selectedCategories.includes(cat.key) ? "active" : ""
              }`}
              onClick={() => toggleCategory(cat.key)}
            >
              {cat.icon ? (
                <img
                  src={`/assets/icons/${cat.icon.displayName}.svg`}
                  alt={cat.key}
                  className="category-icon"
                />
              ) : (
                cat.key
              )}
            </button>
          ))}

          <button
            id="category-btn-small-delete"
            className={`category-btn-small ${
              selectedCategories.length === categories.length ? "active" : ""
            }`}
            onClick={toggleAllCategories}
            style={{ fontWeight: "bold", fontSize: "1rem" }}
          >
            {selectedCategories.length === categories.length ? "X" : "+"}
          </button>
        </div>
      )}

      <div className="places-list">
        {view === "places" &&
          filteredPins.map((pin) => (
            <Link
              to={`/places/${pin._id}`}
              key={pin._id}
              className="places-card"
            >
              {pin.imageUrl && (
                <div className="places-card-img">
                  <img src={pin.imageUrl} alt={pin.title} />
                </div>
              )}
              <h3>{pin.title}</h3>
              <p>
                <strong>Category:</strong> {pin.category}
              </p>
              <p>{pin.description?.slice(0, 80)}...</p>
              <p>
                <IoIosThumbsUp style={{ width: "1.25rem", height: "auto" }} />{" "}
                {pin.likes} &nbsp;{" "}
                <IoIosThumbsDown style={{ width: "1.25rem", height: "auto" }} />{" "}
                {pin.dislikes}
              </p>
            </Link>
          ))}
      </div>
      <div className="lists-list">
        {view === "lists" &&
          lists.map((list) => (
            <Link
              to={`/lists/${list._id}`}
              key={list._id}
              className="lists-card"
            >
              {list.coverImage && (
                <div className="places-card-img">
                  <img
                    src={`http://localhost:8000${list.coverImage}`}
                    alt={list.name}
                  />
                </div>
              )}
              <div className="lists-card-header">
                <h3>{list.name}</h3>
              </div>
              <p className="list-description">{list.description}</p>
              <p>{list.pins?.length || 0} places</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
