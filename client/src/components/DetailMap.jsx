import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { Navigation } from "lucide-react";
import getMarkerElement from "../utils/getMarkerElement";
import useMapInstance from "../hooks/useMapInstance";
import useDirections from "../hooks/useDirections";
import DirectionsCard from "./DirectionsCard";

export default function DetailMap({ lat, lng, category, title }) {
  const mapRef = useRef(null);
  const map = useMapInstance(mapRef, () => ({ center: [lng, lat], zoom: 15 }));
  const { trip, start, setMode, clear } = useDirections(map);

  useEffect(() => {
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.jumpTo({ center: [lng, lat] });
    const marker = new maplibregl.Marker({ element: getMarkerElement(category) })
      .setLngLat([lng, lat])
      .addTo(map);
    return () => marker.remove();
  }, [map, lat, lng, category]);

  function handleClose() {
    clear();
    map?.easeTo({ center: [lng, lat], zoom: 15 });
  }

  return (
    <>
      <div ref={mapRef} className="map-embed" />
      {trip ? (
        <DirectionsCard
          className="directions-inline"
          trip={trip}
          onModeChange={setMode}
          onClose={handleClose}
        />
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-block directions-start"
          onClick={() => start({ lat, lng, title })}
        >
          <Navigation size={17} aria-hidden="true" />
          Get directions
        </button>
      )}
    </>
  );
}
