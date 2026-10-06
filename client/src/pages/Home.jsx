import { useEffect } from "react";
import MapView from "../components/MapView";
import "../styles/Main.css";

export default function Home({ location }) {
  // The map fills the viewport; stop the page itself from scrolling while it's shown.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="home-page">
      <div className="home-container">
        <MapView selectedLocation={location} />
      </div>
    </div>
  );
}
