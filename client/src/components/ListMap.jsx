import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import PopUp from "./PopUp";
import getMarkerElement from "../utils/getMarkerElement";
import { useNavigate } from "react-router-dom";
import CategoryFilter from "./CategoryFilter";
import { categories } from "../utils/categories";

export default function ListMap({ pins }) {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );

  useEffect(() => {
    if (!pins || pins.length === 0) return;

    const instance = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
        import.meta.env.VITE_MAPTILER_API_KEY
      }`,
      center: [pins[0].longitude, pins[0].latitude],
      zoom: 5,
    });

    setMap(instance);

    return () => instance.remove();
  }, [pins]);

  useEffect(() => {
    if (!map || !pins) return;

    // Tüm mevcut marker'ları temizle
    const markers = [];

    pins.forEach((pin) => {
      if (!selectedCategories.includes(pin.category)) return;

      const el = getMarkerElement(pin.category);

      const popupHtml = renderToString(
        <PopUp
          id={pin._id}
          title={pin.title}
          category={pin.category}
          description={pin.description}
          createdBy={pin.createdBy}
          likes={pin.likes}
          dislikes={pin.dislikes}
        />
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);

      marker.getElement().addEventListener("mouseenter", () => {
        new maplibregl.Popup({ offset: 25, closeButton: false })
          .setLngLat([pin.longitude, pin.latitude])
          .setHTML(popupHtml)
          .addTo(map);
      });

      marker.getElement().addEventListener("mouseleave", () => {
        const popups = document.getElementsByClassName("maplibregl-popup");
        if (popups.length > 0) popups[0].remove();
      });

      marker.getElement().addEventListener("click", () => {
        navigate(`/places/${pin._id}`);
      });

      markers.push(marker);
    });

    // Cleanup
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [map, pins, selectedCategories]);

  return (
    <div>
      <div ref={mapRef} className="map-container">
        <CategoryFilter
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
        />
      </div>
    </div>
  );
}
