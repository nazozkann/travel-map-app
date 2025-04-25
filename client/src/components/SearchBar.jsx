import { useState, useEffect } from "react";
import "../styles/Main.css";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const controller = new AbortController();

    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query
        )}&limit=5&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((data) => {
          setResults(data.features || []);
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

  useEffect(() => {
    if (results.length === 0) setHighlightedIndex(-1);
  }, [results]);

  async function handleSearch() {
    if (!query) return;

    const response = await fetch(
      `https://api.maptiler.com/geocoding/${query}.json?key=${
        import.meta.env.VITE_MAPTILER_API_KEY
      }`
    );

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      onSelectLocation({ lng, lat });
    } else {
      alert("Konum bulunamadı!");
    }
  }
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search for a place"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            setHighlightedIndex((prev) => {
              return Math.min(prev + 1, results.length - 1);
            });
          } else if (e.key === "ArrowUp") {
            setHighlightedIndex((prev) => {
              return Math.max(prev - 1, -1);
            });
          } else if (e.key === "Enter") {
            if (highlightedIndex >= 0) {
              const selected = results[highlightedIndex];
              const { lat, lon } = selected.properties;
              onSelectLocation({ lat, lng: lon });
              setQuery("");
              setResults([]);
            } else {
              handleSearch();
            }
          }
        }}
      />
      {results.length > 0 && (
        <ul className="suggestions">
          {results.map((item, index) => (
            <li
              key={item.properties.place_id}
              className={highlightedIndex === index ? "highlighted" : ""}
              onClick={() => {
                setQuery("");
                setResults([]);
                const { lat, lon } = item.properties;
                onSelectLocation({ lat, lng: lon });
              }}
            >
              {item.properties.formatted}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
