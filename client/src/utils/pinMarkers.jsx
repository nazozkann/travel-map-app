import * as maplibregl from "maplibre-gl";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import PopUp from "../components/PopUp";
import getMarkerElement from "./getMarkerElement";

const isTouchDevice = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

// How long the popup survives the pointer leaving the marker, so it can reach the popup.
const HIDE_DELAY_MS = 200;

// Manages pin markers on one map: a hover popup per pin, click opens the pin.
// On touch devices the first tap shows the popup and the second tap opens the pin.
export function createPinMarkers(map, { onOpen, onDirections, canOpen = () => true }) {
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
    let hideTimer = null;

    const cancelHide = () => clearTimeout(hideTimer);

    const hidePopup = () => {
      cancelHide();
      if (activePopup === popup) closeActive();
    };

    const scheduleHide = () => {
      cancelHide();
      hideTimer = setTimeout(hidePopup, HIDE_DELAY_MS);
    };

    const showPopup = () => {
      cancelHide();
      if (!popup) {
        const container = document.createElement("div");
        container.addEventListener("mouseenter", cancelHide);
        container.addEventListener("mouseleave", scheduleHide);
        root = createRoot(container);
        flushSync(() =>
          root.render(
            <PopUp
              pin={pin}
              onOpen={() => canOpen() && onOpen(pin)}
              onDirections={() => {
                hidePopup();
                onDirections?.(pin);
              }}
            />
          )
        );
        popup = new maplibregl.Popup({
          offset: 20,
          maxWidth: "none",
          closeButton: false,
          closeOnClick: false,
          focusAfterOpen: false,
        }).setDOMContent(container);
      }
      if (activePopup !== popup) closeActive();
      popup.setLngLat([pin.longitude, pin.latitude]).addTo(map);
      activePopup = popup;
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
    el.addEventListener("mouseleave", scheduleHide);
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
