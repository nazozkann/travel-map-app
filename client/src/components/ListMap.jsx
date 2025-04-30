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
  const mapInstance = useRef(null);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const navigate = useNavigate();
  const markersRef = useRef([]); // 🔥 marker'ları tutacağımız referans

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      const instance = new maplibregl.Map({
        container: mapRef.current,
        style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
          import.meta.env.VITE_MAPTILER_API_KEY
        }`,
        center: [28.9744, 41.0082], // İstanbul merkezli default center
        zoom: 4,
      });
      mapInstance.current = instance;
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !pins) return;

    // Önce eski marker'ları temizle 🔥
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

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
        .addTo(mapInstance.current);

      marker.getElement().addEventListener("mouseenter", () => {
        new maplibregl.Popup({ offset: 25, closeButton: false })
          .setLngLat([pin.longitude, pin.latitude])
          .setHTML(popupHtml)
          .addTo(mapInstance.current);
      });

      marker.getElement().addEventListener("mouseleave", () => {
        const popups = document.getElementsByClassName("maplibregl-popup");
        if (popups.length > 0) popups[0].remove();
      });

      marker.getElement().addEventListener("click", () => {
        navigate(`/places/${pin._id}`);
      });

      markersRef.current.push(marker); // yeni marker'ı kaydet
    });
  }, [pins, selectedCategories, navigate]);

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
