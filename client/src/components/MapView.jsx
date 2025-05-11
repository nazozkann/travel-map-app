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
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactDOM from "react-dom/client";

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
  const [allPins, setAllPins] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTags, setShowTags] = useState(false);
  const navigate = useNavigate();

  const lightMapStyle = `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;
  const darkMapStyle = `https://api.maptiler.com/maps/0196bac3-e637-7c87-b191-32cc9b5b086a/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;

  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("mapViewState"));
    const savedTheme = localStorage.getItem("theme");
    const mapStyle = savedTheme === "dark" ? darkMapStyle : lightMapStyle;
    const instance = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: savedState ? [savedState.lng, savedState.lat] : [18, 45], // default merkez
      zoom: savedState ? savedState.zoom : 4,
    });
    setMap(instance);

    window.mapInstance = instance;

    return () => instance.remove();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("categories");
    const tagParam = searchParams.get("tags");

    if (categoryParam) {
      setSelectedCategories(categoryParam.split(","));
    }
    if (tagParam) {
      setSelectedTags(tagParam.split(","));
    }
  }, []);
  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/api/pins")
      .then((res) => res.json())
      .then((data) => setAllPins(data));
  }, []);

  useEffect(() => {
    const params = {};
    if (selectedCategories.length > 0) {
      params.categories = selectedCategories.join(",");
    }

    if (selectedTags.length > 0) {
      params.tags = selectedTags.join(",");
    }
    setSearchParams(params);
  }, [selectedCategories, selectedTags]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = allPins.filter((pin) => {
      if (!selectedCategories.includes(pin.category)) return false;
      if (
        selectedTags.length > 0 &&
        selectedTags.length < tags.length &&
        (!Array.isArray(pin.tags) ||
          !pin.tags.some((t) => selectedTags.includes(t)))
      ) {
        return false;
      }
      return true;
    });

    filtered.forEach((pin) => {
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

      let popupOpenId = null; // en üste tanımla

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();

        // Eğer mobil ise ve popup açık değilse: popup göster
        const isTouchDevice =
          "ontouchstart" in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice) {
          if (popupOpenId !== pin._id) {
            popupOpenId = pin._id;

            const tempPopup = new maplibregl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
            })
              .setLngLat([pin.longitude, pin.latitude])
              .setHTML(html)
              .addTo(map);

            const popups = document.getElementsByClassName("maplibregl-popup");
            if (popups.length > 1) {
              for (let i = 0; i < popups.length - 1; i++) {
                popups[i].remove();
              }
            }

            return;
          }

          navigate(`/places/${pin._id}`);
        } else {
          if (!isAdding) {
            navigate(`/places/${pin._id}`);
          }
        }
      });

      markersRef.current.push(marker);
    });
  }, [allPins, selectedCategories, selectedTags, map, isAdding]);

  useEffect(() => {
    if (!map) return;

    const handleMapClick = ({ lngLat }) => {
      const { lng, lat } = lngLat;
      if (!isAdding) return;

      // const formHTML = renderToString(<PinForm />);
      const container = document.createElement("div");
      const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(
        container
      );
      popup.setLngLat([lng, lat]).addTo(map);

      ReactDOM.createRoot(container).render(
        <PinForm
          lat={lat}
          lng={lng}
          onSuccess={(newPin) => {
            const el = getMarkerElement(newPin.category);
            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([newPin.longitude, newPin.latitude])
              .addTo(map);
            popup.remove();
            setIsAdding(false);
          }}
        />
      );

      // popup.on("open", () => {
      //   // const form = document.getElementById("pin-form");
      //   // if (!form) return;
      //   const form = popup
      //     .getElement() // <div class="maplibregl-popup">
      //     .querySelector(".maplibregl-popup-content #pin-form"); // <form id="pin-form">

      //   if (!form) return;

      //   form.addEventListener("submit", async (ev) => {
      //     ev.preventDefault();

      //     const username = localStorage.getItem("username") || "anonim";

      //     const tagValues = Array.from(
      //       form.querySelector('select[name="tags"]').selectedOptions,
      //       (o) => o.value
      //     );

      //     const jsonBody = {
      //       title: ev.target.title.value,
      //       category: ev.target.category.value,
      //       description: ev.target.description.value,
      //       tags: tagValues,
      //       latitude: lat,
      //       longitude: lng,
      //       createdBy: username,
      //     };

      //     try {
      //       const res = await fetch(
      //         import.meta.env.VITE_API_URL + "/api/pins",
      //         {
      //           method: "POST",
      //           headers: { "Content-Type": "application/json" },
      //           body: JSON.stringify(jsonBody),
      //         }
      //       );

      //       if (!res.ok) {
      //         const errMsg = await res.text();
      //         console.error("⛔ Sunucu cevabı:", errMsg);
      //         alert("Pin kaydedilirken hata oluştu");
      //         return;
      //       }

      //       const newPin = await res.json();

      //       const el = getMarkerElement(newPin.category);
      //       const marker = new maplibregl.Marker({ element: el })
      //         .setLngLat([newPin.longitude, newPin.latitude])
      //         .addTo(map);

      //       const popupHTML = renderToString(
      //         <PopUp
      //           id={newPin._id}
      //           title={newPin.title}
      //           category={newPin.category}
      //           createdBy={newPin.createdBy}
      //           description={newPin.description}
      //           likes={newPin.likes}
      //           dislikes={newPin.dislikes}
      //         />
      //       );
      //       const hoverPopup = new maplibregl.Popup({
      //         offset: 25,
      //         closeButton: false,
      //         closeOnClick: false,
      //       }).setHTML(popupHTML);

      //       marker.getElement().addEventListener("mouseenter", () => {
      //         hoverPopup
      //           .setLngLat([newPin.longitude, newPin.latitude])
      //           .addTo(map);
      //       });
      //       marker.getElement().addEventListener("mouseleave", () => {
      //         hoverPopup.remove();
      //       });

      //       markersRef.current.push(marker);
      //       popup.remove();
      //       setIsAdding(false);
      //     } catch (err) {
      //       console.error("Pin eklenemedi:", err);
      //     }
      //   });
      // });
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

    const saveViewState = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const state = {
        lng: center.lng,
        lat: center.lat,
        zoom,
      };
      localStorage.setItem("mapViewState", JSON.stringify(state));
    };

    map.on("moveend", saveViewState);

    return () => {
      map.off("moveend", saveViewState);
    };
  }, [map]);

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
        showTags={showTags}
        setShowTags={setShowTags}
      />
    </div>
  );
}
