import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "../styles/Main.css";

export default function Home() {
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
        import.meta.env.VITE_MAPTILER_API_KEY
      }`,
      center: [18, 45],
      zoom: 4,
    });

    return () => {
      map.remove();
    };
  }, []);
  return <div ref={mapContainer} className="map-container"></div>;
}
