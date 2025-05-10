import { useEffect, useRef, useState } from "react";
import maplibregl, { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import PopUp from "./PopUp";
import getMarkerElement from "../utils/getMarkerElement";
import { useNavigate } from "react-router-dom";
import CategoryFilter from "./CategoryFilter";
import { categories } from "../utils/categories";

export default function ListMap({ pins }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const navigate = useNavigate();
  const markersRef = useRef([]);

  const boundsFittedRef = useRef(false);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      const instance = new maplibregl.Map({
        container: mapRef.current,
        style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`,
        center: [28.9744, 41.0082],
        zoom: 4,
      });
      mapInstance.current = instance;
    }
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !pins || pins.length === 0 || boundsFittedRef.current) return;

    // Harita yüklendiyse doğrudan çalıştır
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
        map.fitBounds(bounds, {
          padding: 50,
          duration: 1000,
          maxZoom: 14,
        });
        boundsFittedRef.current = true;
      }
    };

    if (map.loaded()) {
      fitMapToPins();
    } else {
      map.once("load", fitMapToPins);
    }
  }, [pins]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !pins) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(pin.category)
      ) {
        return;
      }

      const allTags = selectedTags.length === 0;
      const hasTag = Array.isArray(pin.tags)
        ? pin.tags.some((t) => selectedTags.includes(t))
        : false;
      if (!allTags && !hasTag) {
        return;
      }

      const html = renderToString(
        <PopUp
          id={pin._id}
          title={pin.title}
          category={pin.category}
          description={pin.description}
          createdBy={pin.createdBy}
          likes={pin.likes}
          dislikes={pin.dislikes}
          imageUrl={pin.imageUrl}
        />
      );

      const el = getMarkerElement(pin.category);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);

      marker
        .getElement()
        .addEventListener("mouseenter", () =>
          new maplibregl.Popup({ offset: 25, closeButton: false })
            .setLngLat([pin.longitude, pin.latitude])
            .setHTML(html)
            .addTo(map)
        );
      marker.getElement().addEventListener("mouseleave", () => {
        const popups = document.getElementsByClassName("maplibregl-popup");
        if (popups.length) popups[0].remove();
      });
      marker
        .getElement()
        .addEventListener("click", () => navigate(`/places/${pin._id}`));

      markersRef.current.push(marker);
    });
  }, [pins, selectedCategories, selectedTags, navigate]);

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
