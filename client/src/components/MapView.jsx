import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView({ selectedLocation }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
        import.meta.env.VITE_MAPTILER_API_KEY
      }`,
      center: [29, 39],
      zoom: 4,
    });
    instance.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new maplibregl.Marker()
          .setLngLat([lng, lat])
          .addTo(instance);
      }
    });

    setMap(instance);
    return () => instance.remove();
  }, []);
  useEffect(() => {
    if (map && selectedLocation) {
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 10,
      });

      if (markerRef.current) {
        markerRef.current.setLngLat([
          selectedLocation.lng,
          selectedLocation.lat,
        ]);
      } else {
        markerRef.current = new maplibregl.Marker()
          .setLngLat([selectedLocation.lng, selectedLocation.lat])
          .addTo(map);
      }
    }
  }, [selectedLocation, map]);
  return <div ref={mapRef} className="map-container" />;
}
