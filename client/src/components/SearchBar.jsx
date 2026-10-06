import { useState, useEffect } from "react";
import "../styles/Navbar.css";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query
        )}&limit=5&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`,
        { signal: controller.signal }
      )
        .then((res) => (res.ok ? res.json() : { features: [] }))
        .then((data) => {
          setResults(data.features || []);
          setHighlightedIndex(-1);
        })
        .catch((err) => {
          if (err.name !== "AbortError") console.error(err);
        });
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function selectResult(item) {
    const { lat, lon } = item.properties;
    onSelectLocation({ lat, lng: lon });
    setQuery("");
    setResults([]);
  }

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          query.trim()
        )}.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        onSelectLocation({ lng, lat });
        setResults([]);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setNotFound(true);
    }
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search for a place"
        aria-label="Search for a place"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, -1));
          } else if (e.key === "Escape") {
            setResults([]);
          } else if (e.key === "Enter") {
            if (highlightedIndex >= 0 && results[highlightedIndex]) {
              selectResult(results[highlightedIndex]);
            } else {
              handleSearch();
            }
          }
        }}
      />
      {results.length > 0 && (
        <ul className="suggestions" role="listbox">
          {results.map((item, index) => (
            <li
              key={item.properties.place_id ?? index}
              role="option"
              aria-selected={highlightedIndex === index}
              className={highlightedIndex === index ? "highlighted" : ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectResult(item)}
            >
              {item.properties.formatted}
            </li>
          ))}
        </ul>
      )}
      {notFound && results.length === 0 && (
        <ul className="suggestions">
          <li>No location found</li>
        </ul>
      )}
    </div>
  );
}
