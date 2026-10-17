import { useEffect, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { categories } from "../utils/categories";
import { api } from "../utils/api";
import { CardGrid, EmptyState, ListCard, PlaceCard } from "../components/Cards";
import PageStatus from "../components/PageStatus";

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

  if (loading) return <PageStatus />;
  if (error) return <PageStatus>{error}</PageStatus>;

  const results = view === "places" ? filteredPins : filteredLists;
  const allSelected = selectedCategories.length === categories.length;

  return (
    <main className="page">
      <header className="page-header">
        <h1>Discover</h1>
        <p className="muted">Top-rated places and lists from the community.</p>
      </header>

      <div className="toolbar">
        <div className="segmented" role="tablist">
          {[
            ["places", "Places"],
            ["lists", "Lists"],
          ].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              className={view === key ? "active" : ""}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="Filter by city"
            aria-label="Filter by city"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
        </label>
      </div>

      <div className="chip-row chip-row-scroll">
        <button
          type="button"
          aria-pressed={allSelected}
          className={`chip ${allSelected ? "active" : ""}`}
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
              className={`chip chip-cat ${active ? "active" : ""}`}
              style={{ "--c": `var(--cat-${key})` }}
              onClick={() => toggleCategory(key)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {results.length === 0 ? (
        <EmptyState icon={SearchX} title={`No ${view} match your filters`}>
          Try another city or turn on more categories.
        </EmptyState>
      ) : (
        <CardGrid>
          {view === "places"
            ? filteredPins.map((pin) => <PlaceCard key={pin._id} pin={pin} />)
            : filteredLists.map((list) => <ListCard key={list._id} list={list} />)}
        </CardGrid>
      )}
    </main>
  );
}
