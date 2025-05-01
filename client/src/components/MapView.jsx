import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import PopUp from "./PopUp";
import PinForm from "./PinForm";
import getMarkerElement from "../utils/getMarkerElement";
import CategoryFilter from "./CategoryFilter";
import { categories } from "../utils/categories";
import { tags } from "../utils/tags";
import { useNavigate } from "react-router-dom";

export default function MapView({ selectedLocation }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markersRef = useRef([]);
  const [map, setMap] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const [selectedTags, setSelectedTags] = useState([]);
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

    return () => instance.remove();
  }, []);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    fetch(import.meta.env.VITE_API_URL + "/api/pins")
      .then((res) => res.json())
      .then((pins) => {
        pins.forEach((pin) => {
          if (!selectedCategories.includes(pin.category)) return;

          const filterTags =
            selectedTags.length > 0 && selectedTags.length < tags.length;
          if (filterTags) {
            if (
              !Array.isArray(pin.tags) ||
              !pin.tags.some((t) => selectedTags.includes(t))
            ) {
              return;
            }
          }

          const html = renderToString(
            <PopUp
              id={pin._id}
              title={pin.title}
              category={pin.category}
              createdBy={pin.createdBy}
              description={pin.description}
              likes={pin.likes}
              dislikes={pin.dislikes}
              imageUrl={pin.imageUrl}
            />
          );

          const el = getMarkerElement(pin.category);
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([pin.longitude, pin.latitude])
            .addTo(map);

          marker.getElement().addEventListener("mouseenter", () =>
            new maplibregl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
            })
              .setLngLat([pin.longitude, pin.latitude])
              .setHTML(html)
              .addTo(map)
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

          markersRef.current.push(marker);
        });
      });
  }, [selectedCategories, map, isAdding, selectedTags]);

  useEffect(() => {
    if (!map) return;

    const handleMapClick = ({ lngLat }) => {
      const { lng, lat } = lngLat;
      if (!isAdding) return;

      const formHTML = renderToString(<PinForm />);
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(formHTML);
      popup.setLngLat([lng, lat]).addTo(map);

      popup.on("open", () => {
        // const form = document.getElementById("pin-form");
        // if (!form) return;
        const form = popup
          .getElement() // <div class="maplibregl-popup">
          .querySelector(".maplibregl-popup-content #pin-form"); // <form id="pin-form">

        if (!form) return;

        form.addEventListener("submit", async (ev) => {
          ev.preventDefault();

          const username = localStorage.getItem("username") || "anonim";

          const tagValues = Array.from(
            form.querySelector('select[name="tags"]').selectedOptions,
            (o) => o.value
          );

          const jsonBody = {
            title: ev.target.title.value,
            category: ev.target.category.value,
            description: ev.target.description.value,
            tags: tagValues,
            latitude: lat,
            longitude: lng,
            createdBy: username,
          };

          try {
            const res = await fetch(
              import.meta.env.VITE_API_URL + "/api/pins",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonBody),
              }
            );

            if (!res.ok) {
              const errMsg = await res.text();
              console.error("⛔ Sunucu cevabı:", errMsg);
              alert("Pin kaydedilirken hata oluştu");
              return;
            }

            const newPin = await res.json();

            const el = getMarkerElement(newPin.category);
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([newPin.longitude, newPin.latitude])
              .addTo(map);

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
                .addTo(map);
            });
            marker.getElement().addEventListener("mouseleave", () => {
              hoverPopup.remove();
            });

            markersRef.current.push(marker);
            popup.remove();
            setIsAdding(false);
          } catch (err) {
            console.error("Pin eklenemedi:", err);
          }
        });
      });
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isAdding]);

  useEffect(() => {
    if (map && selectedLocation) {
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 12,
        speed: 1.5,
        curve: 1,
        essential: true,
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

  useEffect(() => {
    if (!map) return;
    map.getCanvas().style.cursor = isAdding ? "crosshair" : "";
  }, [isAdding, map]);

  return (
    <div ref={mapRef} className="map-container">
      <CategoryFilter
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        isAdding={isAdding}
        setIsAdding={setIsAdding}
        setSelectedTags={setSelectedTags}
        selectedTags={selectedTags}
      />
    </div>
  );
}
