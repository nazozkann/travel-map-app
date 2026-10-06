import * as maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import PopUp from "../components/PopUp";
import getMarkerElement from "./getMarkerElement";

const isTouchDevice = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Manages pin markers on one map: a hover popup per pin, click opens the pin.
// On touch devices the first tap shows the popup and the second tap opens the pin.
export function createPinMarkers(map, { onOpen, canOpen = () => true }) {
  let entries = [];
  let activePopup = null;
  let activeTouchId = null;

  const closeActive = () => {
    activePopup?.remove();
    activePopup = null;
  };

  const handleMapClick = () => {
    closeActive();
    activeTouchId = null;
  };
  map.on("click", handleMapClick);

  function add(pin) {
    const el = getMarkerElement(pin.category);
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([pin.longitude, pin.latitude])
      .addTo(map);

    let popup = null;
    let root = null;

    const showPopup = () => {
      if (!popup) {
        const container = document.createElement("div");
        root = createRoot(container);
        flushSync(() => root.render(<PopUp {...pin} />));
        popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
        }).setDOMContent(container);
      }
      if (activePopup !== popup) closeActive();
      popup.setLngLat([pin.longitude, pin.latitude]).addTo(map);
      activePopup = popup;
    };

    const hidePopup = () => {
      if (activePopup === popup) closeActive();
    };

    const handleClick = (e) => {
      e.stopPropagation();
      if (!canOpen()) return;
      if (isTouchDevice() && activeTouchId !== pin._id) {
        activeTouchId = pin._id;
        showPopup();
        return;
      }
      onOpen(pin);
    };

    el.addEventListener("mouseenter", showPopup);
    el.addEventListener("mouseleave", hidePopup);
    el.addEventListener("click", handleClick);

    entries.push({
      remove() {
        hidePopup();
        popup?.remove();
        marker.remove();
        if (root) {
          const r = root;
          // Unmount outside of any in-progress React render.
          setTimeout(() => r.unmount());
        }
      },
    });
  }

  function clear() {
    entries.forEach((e) => e.remove());
    entries = [];
    activeTouchId = null;
  }

  function destroy() {
    clear();
    map.off("click", handleMapClick);
  }

  return { add, clear, destroy };
}
