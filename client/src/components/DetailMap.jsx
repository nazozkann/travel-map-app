import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import getMarkerElement from "../utils/getMarkerElement";

export default function DetailMap({ lat, lng, category }) {
  const mapRef = useRef(null);
  const lightMapStyle = `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;
  const darkMapStyle = `https://api.maptiler.com/maps/0196bac3-e637-7c87-b191-32cc9b5b086a/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;

  useEffect(() => {
    if (!lat || !lng) return;
    const savedTheme = localStorage.getItem("theme");
    const selectedStyle = savedTheme === "dark" ? darkMapStyle : lightMapStyle;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: selectedStyle,
      center: [lng, lat],
      zoom: 15,
    });

    const el = getMarkerElement(category);

    new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    window.detailMapInstance = map;
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
