import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { useNavigate } from "react-router-dom";
import CategoryFilter from "./CategoryFilter";
import { categories } from "../utils/categories";
import useMapInstance from "../hooks/useMapInstance";
import { createPinMarkers } from "../utils/pinMarkers";
import filterPins from "../utils/filterPins";

const getInitialView = () => ({ center: [28.9744, 41.0082], zoom: 4 });

export default function ListMap({ pins }) {
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const boundsFittedRef = useRef(false);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const navigate = useNavigate();

  const map = useMapInstance(mapRef, getInitialView);

  const visiblePins = useMemo(
    () => filterPins(pins || [], selectedCategories, selectedTags),
    [pins, selectedCategories, selectedTags]
  );

  useEffect(() => {
    if (!map || !pins || pins.length === 0 || boundsFittedRef.current) return;

    const fitMapToPins = () => {
      const bounds = new maplibregl.LngLatBounds();
      pins.forEach((pin) => {
        if (
          typeof pin.longitude === "number" &&
          typeof pin.latitude === "number"
        ) {
          bounds.extend([pin.longitude, pin.latitude]);
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, duration: 1000, maxZoom: 14 });
        boundsFittedRef.current = true;
      }
    };

    if (map.loaded()) {
      fitMapToPins();
    } else {
      map.once("load", fitMapToPins);
      return () => map.off("load", fitMapToPins);
    }
  }, [map, pins]);

  useEffect(() => {
    if (!map) return;
    markersRef.current = createPinMarkers(map, {
      onOpen: (pin) => navigate(`/places/${pin._id}`),
    });
    return () => {
      markersRef.current.destroy();
      markersRef.current = null;
    };
  }, [map, navigate]);

  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;
    markers.clear();
    visiblePins.forEach((pin) => markers.add(pin));
  }, [visiblePins, map]);

  return (
    <div>
      <div ref={mapRef} className="map-container">
        <CategoryFilter
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          showTags={showTags}
          setShowTags={setShowTags}
        />
      </div>
    </div>
  );
}
