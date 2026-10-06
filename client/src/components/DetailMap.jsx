import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import getMarkerElement from "../utils/getMarkerElement";
import useMapInstance from "../hooks/useMapInstance";

export default function DetailMap({ lat, lng, category }) {
  const mapRef = useRef(null);
  const map = useMapInstance(mapRef, () => ({ center: [lng, lat], zoom: 15 }));

  useEffect(() => {
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.jumpTo({ center: [lng, lat] });
    const marker = new maplibregl.Marker({ element: getMarkerElement(category) })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => marker.remove();
  }, [map, lat, lng, category]);

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
