import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import getMarkerElement from "../utils/getMarkerElement";

export default function DetailMap({ lat, lng, category }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
        import.meta.env.VITE_MAPTILER_API_KEY
      }`,
      center: [lng, lat],
      zoom: 15,
    });

    const el = getMarkerElement(category);

    new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    return () => map.remove();
  }, [lat, lng, category]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
        marginTop: "1rem",
      }}
    />
  );
}
