import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import PopUp from "./PopUp";
import PinForm from "./PinForm";
import getMarkerElement from "../utils/getMarkerElement";
import CategoryFilter from "./CategoryFilter";
import { categories } from "../utils/categories";
import { useNavigate } from "react-router-dom";

export default function MapView({ selectedLocation }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isAdding, setIsAdding] = useState(false); // 📍 Ekleme modu
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const navigate = useNavigate();

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
        import.meta.env.VITE_MAPTILER_API_KEY
      }`,
      center: [18, 45],
      zoom: 4,
    });
    setMap(instance);

    fetch("http://localhost:8000/api/pins")
      .then((res) => res.json())
      .then((pins) => {
        pins.forEach((pin) => {
          if (!selectedCategories.includes(pin.category)) return;

          const html = renderToString(
            <PopUp
              id={pin._id}
              title={pin.title}
              category={pin.category}
              createdBy={pin.createdBy}
              description={pin.description}
              likes={pin.likes}
              dislikes={pin.dislikes}
            />
          );

          const el = getMarkerElement(pin.category);
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([pin.longitude, pin.latitude])
            .addTo(instance);

          marker.getElement().addEventListener("mouseenter", () =>
            new maplibregl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
            })
              .setLngLat([pin.longitude, pin.latitude])
              .setHTML(html)
              .addTo(instance)
          );

          marker.getElement().addEventListener("mouseleave", () => {
            const popups = document.getElementsByClassName("maplibregl-popup");
            if (popups.length > 0) {
              popups[0].remove();
            }
          });
          marker.getElement().addEventListener("click", () => {
            if (!isAdding) {
              navigate(`/places/${pin._id}`);
            }
          });
        });
      });

    instance.on("click", ({ lngLat }) => {
      const { lng, lat } = lngLat;

      if (!isAdding) return;

      const formHTML = renderToString(<PinForm />);

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(formHTML);

      popup.on("open", () => {
        const form = document.getElementById("pin-form");
        if (!form) return;

        form.addEventListener("submit", async (ev) => {
          ev.preventDefault();

          const username = localStorage.getItem("username") || "anonim";

          const body = {
            title: form.title.value,
            category: form.category.value,
            description: form.description.value,
            latitude: lat,
            longitude: lng,
            createdBy: username,
          };

          try {
            const res = await fetch("http://localhost:8000/api/pins", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const newPin = await res.json();

            const el = getMarkerElement(newPin.category);
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([newPin.longitude, newPin.latitude])
              .addTo(instance);

            const popupHTML = renderToString(
              <PopUp
                id={newPin._id}
                title={newPin.title}
                category={newPin.category}
                createdBy={newPin.createdBy}
                description={newPin.description}
                likes={newPin.likes}
                dislikes={newPin.dislikes}
              />
            );

            const hoverPopup = new maplibregl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
            }).setHTML(popupHTML);

            marker.getElement().addEventListener("mouseenter", () => {
              hoverPopup
                .setLngLat([newPin.longitude, newPin.latitude])
                .addTo(instance);
            });

            marker.getElement().addEventListener("mouseleave", () => {
              hoverPopup.remove();
            });

            popup.remove();
            setIsAdding(false); // buton reset
          } catch (err) {
            console.error("Pin eklenemedi:", err);
          }
        });
      });

      popup.setLngLat([lng, lat]).addTo(instance);
    });

    return () => instance.remove();
  }, [selectedCategories, isAdding]);

  useEffect(() => {
    if (map) {
      map.getCanvas().style.cursor = isAdding ? "crosshair" : "grab";
    }
  }, [isAdding, map]);

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

  return (
    <div ref={mapRef} className="map-container">
      <CategoryFilter
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      />

      <div className="add-pin-button" onClick={() => setIsAdding(!isAdding)}>
        {isAdding ? "❌ Cancel" : "📍 Add Pin"}
      </div>
    </div>
  );
}
