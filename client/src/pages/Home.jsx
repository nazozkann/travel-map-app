import { useEffect } from "react";
import MapView from "../components/MapView";

export default function Home({ location }) {
  // The map fills the viewport; stop the page itself from scrolling while it's shown.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return <MapView selectedLocation={location} />;
}
