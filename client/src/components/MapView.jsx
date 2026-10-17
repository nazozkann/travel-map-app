import { useState, useEffect, useRef, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import { Plus, X } from "lucide-react";
import PinForm from "./PinForm";
import CategoryFilter from "./CategoryFilter";
import Modal from "./Modal";
import { categories } from "../utils/categories";
import { tags } from "../utils/tags";
import { useNavigate, useSearchParams } from "react-router-dom";
import useMapInstance from "../hooks/useMapInstance";
import { createPinMarkers } from "../utils/pinMarkers";
import filterPins from "../utils/filterPins";
import { api } from "../utils/api";
import { getUsername } from "../utils/auth";

const DEFAULT_VIEW = { center: [18, 45], zoom: 4 };

function readSavedView() {
  try {
    const saved = JSON.parse(localStorage.getItem("mapViewState"));
    if (saved && Number.isFinite(saved.lng) && Number.isFinite(saved.lat)) {
      return { center: [saved.lng, saved.lat], zoom: saved.zoom ?? 4 };
    }
  } catch {
    // corrupted value, fall back to default
  }
  return DEFAULT_VIEW;
}

function readListParam(searchParams, name, allowed) {
  const value = searchParams.get(name);
  if (value === null) return null;
  return value.split(",").filter((v) => allowed.includes(v));
}

export default function MapView({ selectedLocation }) {
  const mapRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const isAddingRef = useRef(false);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState(
    () =>
      readListParam(
        searchParams,
        "categories",
        categories.map((c) => c.key)
      ) ?? categories.map((cat) => cat.key)
  );
  const [selectedTags, setSelectedTags] = useState(
    () =>
      readListParam(
        searchParams,
        "tags",
        tags.map((t) => t.key)
      ) ?? []
  );
  const [allPins, setAllPins] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const navigate = useNavigate();

  const map = useMapInstance(mapRef, readSavedView);

  useEffect(() => {
    isAddingRef.current = isAdding;
  }, [isAdding]);

  useEffect(() => {
    api("/api/pins")
      .then(setAllPins)
      .catch((err) => console.error("Pins couldn't be loaded:", err));
  }, []);

  // Mirror filters in the URL without adding history entries (keeps Back working).
  useEffect(() => {
    const params = {
      categories: selectedCategories.join(","),
    };
    if (selectedTags.length > 0) params.tags = selectedTags.join(",");
    setSearchParams(params, { replace: true });
  }, [selectedCategories, selectedTags, setSearchParams]);

  const filteredPins = useMemo(
    () => filterPins(allPins, selectedCategories, selectedTags),
    [allPins, selectedCategories, selectedTags]
  );

  const markersRef = useRef(null);
  useEffect(() => {
    if (!map) return;
    markersRef.current = createPinMarkers(map, {
      onOpen: (pin) => navigate(`/places/${pin._id}`),
      canOpen: () => !isAddingRef.current,
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
    filteredPins.forEach((pin) => markers.add(pin));
  }, [filteredPins, map]);

  // In add mode, a map click drops a draft marker and opens the form for that spot.
  useEffect(() => {
    if (!map || !isAdding) return;
    const handleMapClick = ({ lngLat }) => setDraft({ lng: lngLat.lng, lat: lngLat.lat });
    map.on("click", handleMapClick);
    return () => map.off("click", handleMapClick);
  }, [map, isAdding]);

  useEffect(() => {
    if (!map || !draft) return;
    const marker = new maplibregl.Marker({ color: "#2563eb" })
      .setLngLat([draft.lng, draft.lat])
      .addTo(map);
    return () => marker.remove();
  }, [map, draft]);

  useEffect(() => {
    if (!isAdding) setDraft(null);
  }, [isAdding]);

  function handleSetIsAdding(updater) {
    const next = typeof updater === "function" ? updater(isAdding) : updater;
    if (next && !getUsername()) {
      alert("You need to be logged in to add a place");
      navigate("/auth");
      return;
    }
    setIsAdding(next);
  }

  useEffect(() => {
    if (!map || !selectedLocation) return;
    const lngLat = [selectedLocation.lng, selectedLocation.lat];
    map.flyTo({
      center: lngLat,
      zoom: 12,
      speed: 1.5,
      curve: 1,
      essential: true,
    });

    if (searchMarkerRef.current) {
      searchMarkerRef.current.setLngLat(lngLat);
    } else {
      searchMarkerRef.current = new maplibregl.Marker()
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [selectedLocation, map]);

  useEffect(() => {
    if (!map) return;
    searchMarkerRef.current = null;

    const saveViewState = () => {
      const center = map.getCenter();
      try {
        localStorage.setItem(
          "mapViewState",
          JSON.stringify({ lng: center.lng, lat: center.lat, zoom: map.getZoom() })
        );
      } catch {
        // storage unavailable (private mode / quota)
      }
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
        setSelectedTags={setSelectedTags}
        selectedTags={selectedTags}
        showTags={showTags}
        setShowTags={setShowTags}
      />

      {isAdding && !draft && (
        <div className="map-hint" role="status">
          Tap anywhere on the map to drop a pin
        </div>
      )}

      <button
        type="button"
        className={`fab ${isAdding ? "fab-cancel" : ""}`}
        onClick={() => handleSetIsAdding((prev) => !prev)}
      >
        {isAdding ? <X size={20} /> : <Plus size={20} />}
        {isAdding ? "Cancel" : "Add place"}
      </button>

      {draft && (
        <Modal title="Add a place" onClose={() => setDraft(null)}>
          <PinForm
            lat={draft.lat}
            lng={draft.lng}
            onCancel={() => setDraft(null)}
            onSuccess={(newPin) => {
              setAllPins((prev) => [...prev, newPin]);
              setIsAdding(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
