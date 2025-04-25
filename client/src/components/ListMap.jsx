import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToString } from "react-dom/server";
import PopUp from "./PopUp";
import getMarkerElement from "../utils/getMarkerElement";
import { useNavigate } from "react-router-dom";

export default function ListMap({ pins }) {
  const mapRef = useRef(null);
  const navigate = useNavigate();

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

    pins.forEach((pin) => {
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
        .addTo(instance);

      marker.getElement().addEventListener("mouseenter", () => {
        new maplibregl.Popup({ offset: 25, closeButton: false })
          .setLngLat([pin.longitude, pin.latitude])
          .setHTML(popupHtml)
          .addTo(instance);
      });

      marker.getElement().addEventListener("mouseleave", () => {
        const popups = document.getElementsByClassName("maplibregl-popup");
        if (popups.length > 0) popups[0].remove();
      });

      marker.getElement().addEventListener("click", () => {
        navigate(`/places/${pin._id}`);
      });
    });

    return () => instance.remove();
  }, [pins]);

  return (
    <div ref={mapRef} className="map-container" style={{ height: "400px" }} />
  );
}
