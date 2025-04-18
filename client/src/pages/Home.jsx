import { useState } from "react";
import SearchBar from "../components/SearchBar";
import MapView from "../components/MapView";
import "../styles/Main.css";

export default function Home() {
  const [location, setLocation] = useState(null);

  return (
    <>
      <SearchBar onSelectLocation={setLocation} />
      <MapView selectedLocation={location} />
    </>
  );
}
