import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Main.css";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
import { categories, categoryLabel } from "../utils/categories";
import { api } from "../utils/api";

// Lower bound of the Wilson score interval: ranks by approval while
// accounting for how many votes a place has.
function wilsonScore(likes = 0, dislikes = 0) {
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

const truncate = (text = "", max = 80) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

export default function BestPlaces() {
  const [pins, setPins] = useState([]);
  const [lists, setLists] = useState([]);
  const [view, setView] = useState("places");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const [searchCity, setSearchCity] = useState("");

  useEffect(() => {
    Promise.all([api("/api/pins"), api("/api/lists/all")])
      .then(([pinData, listData]) => {
        setPins(
          pinData
            .slice()
            .sort(
              (a, b) =>
                wilsonScore(b.likes, b.dislikes) -
                wilsonScore(a.likes, a.dislikes)
            )
        );
        setLists(
          listData
            .slice()
            .sort((a, b) => (b.pins?.length || 0) - (a.pins?.length || 0))
        );
      })
      .catch((err) => {
        console.error(err);
        setError("Couldn't load places. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  const city = searchCity.trim().toLowerCase();

  const filteredPins = useMemo(
    () =>
      pins.filter(
        (pin) =>
          selectedCategories.includes(pin.category) &&
          (!city || pin.city?.toLowerCase().includes(city))
      ),
    [pins, selectedCategories, city]
  );
  const filteredLists = useMemo(
    () =>
      lists.filter((list) =>
        list.pins?.some(
          (pin) =>
            pin &&
            selectedCategories.includes(pin.category) &&
            (!city || pin.city?.toLowerCase().includes(city))
        )
      ),
    [lists, selectedCategories, city]
  );

  function toggleCategory(catKey) {
    setSelectedCategories((prev) =>
      prev.includes(catKey)
        ? prev.filter((c) => c !== catKey)
        : [...prev, catKey]
    );
  }
  function toggleAllCategories() {
    setSelectedCategories((prev) =>
      prev.length === categories.length ? [] : categories.map((cat) => cat.key)
    );
  }

  if (loading) return <p className="page-status">Loading...</p>;
  if (error) return <p className="page-status">{error}</p>;

  const results = view === "places" ? filteredPins : filteredLists;

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
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search by city..."
            aria-label="Search by city"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="category-filter-bar">
        {categories.map((cat) => (
          <button
            key={cat.key}
            title={cat.label}
            aria-label={cat.label}
            aria-pressed={selectedCategories.includes(cat.key)}
            className={`category-btn-${cat.key} category-btn-small ${
              selectedCategories.includes(cat.key) ? "active" : ""
            }`}
            onClick={() => toggleCategory(cat.key)}
          >
            <img src={cat.icon} alt="" className="category-icon" />
          </button>
        ))}

        <button
          id="category-btn-small-delete"
          className={`category-btn-small ${
            selectedCategories.length === categories.length ? "active" : ""
          }`}
          onClick={toggleAllCategories}
          title={
            selectedCategories.length === categories.length
              ? "Clear categories"
              : "Select all categories"
          }
          style={{ fontWeight: "bold", fontSize: "1rem" }}
        >
          {selectedCategories.length === categories.length ? "X" : "+"}
        </button>
      </div>

      {results.length === 0 && (
        <p className="page-status">No {view} match your filters.</p>
      )}

      {view === "places" && (
        <div className="places-list">
          {filteredPins.map((pin) => (
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
                <strong>Category:</strong> {categoryLabel(pin.category)}
              </p>
              <p>{truncate(pin.description)}</p>
              <p>
                <IoIosThumbsUp style={{ width: "1.25rem", height: "auto" }} />{" "}
                {pin.likes} &nbsp;{" "}
                <IoIosThumbsDown style={{ width: "1.25rem", height: "auto" }} />{" "}
                {pin.dislikes}
              </p>
            </Link>
          ))}
        </div>
      )}
      {view === "lists" && (
        <div className="lists-list">
          {filteredLists.map((list) => (
            <Link
              to={`/lists/${list._id}`}
              key={list._id}
              className="lists-card"
            >
              {list.coverImage && (
                <div className="places-card-img">
                  <img src={list.coverImage} alt={list.name} />
                </div>
              )}
              <div className="lists-card-header">
                <h3>{list.name}</h3>
              </div>
              <p className="list-description">{list.description}</p>
              <p>{list.pins?.filter(Boolean).length || 0} places</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
