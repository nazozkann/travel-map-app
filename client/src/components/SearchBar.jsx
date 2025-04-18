import { useState } from "react";
import "../styles/Main.css";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");

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
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
    </div>
  );
}
