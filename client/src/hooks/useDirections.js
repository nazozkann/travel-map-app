import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { defaultMode, fetchRoute, getCurrentPosition } from "../utils/directions";

const ROUTE_ID = "directions-route";

const cssVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

function drawRoute(map, geometry) {
  const data = { type: "Feature", geometry, properties: {} };
  const source = map.getSource(ROUTE_ID);
  if (source) {
    source.setData(data);
    return;
  }
  const layout = { "line-join": "round", "line-cap": "round" };
  map.addSource(ROUTE_ID, { type: "geojson", data });
  map.addLayer({
    id: `${ROUTE_ID}-casing`,
    type: "line",
    source: ROUTE_ID,
    layout,
    paint: { "line-color": cssVar("--surface"), "line-width": 9 },
  });
  map.addLayer({
    id: ROUTE_ID,
    type: "line",
    source: ROUTE_ID,
    layout,
    paint: { "line-color": cssVar("--accent"), "line-width": 5 },
  });
}

function removeRoute(map) {
  try {
    if (map.getLayer(ROUTE_ID)) map.removeLayer(ROUTE_ID);
    if (map.getLayer(`${ROUTE_ID}-casing`)) map.removeLayer(`${ROUTE_ID}-casing`);
    if (map.getSource(ROUTE_ID)) map.removeSource(ROUTE_ID);
  } catch {
    // map already destroyed
  }
}

function routeBounds({ type, coordinates }) {
  const points = type === "MultiLineString" ? coordinates.flat() : coordinates;
  return points.reduce(
    (bounds, point) => bounds.extend(point),
    new maplibregl.LngLatBounds(points[0], points[0])
  );
}

function originMarkerElement() {
  const el = document.createElement("div");
  el.className = "user-location";
  el.setAttribute("aria-label", "Your location");
  return el;
}

// Routes from the user's current location to a place and draws it on `map`.
// trip.status: "locating" → "routing" → "ready" | "error".
export default function useDirections(map, { padding = 48 } = {}) {
  const [trip, setTrip] = useState(null);
  const paddingRef = useRef(padding);
  paddingRef.current = padding;

  const start = useCallback(
    (to) => setTrip({ to, mode: null, activeMode: null, status: "locating" }),
    []
  );
  const setMode = useCallback(
    (mode) =>
      setTrip((t) => t && { ...t, mode, activeMode: mode, status: "routing", error: null }),
    []
  );
  const clear = useCallback(() => setTrip(null), []);

  const to = trip?.to;
  const requestedMode = trip?.mode;

  useEffect(() => {
    if (!to) return;
    const controller = new AbortController();
    const update = (patch) => {
      if (controller.signal.aborted) return;
      setTrip((t) => (t?.to === to ? { ...t, ...patch } : t));
    };

    (async () => {
      try {
        const from = await getCurrentPosition();
        if (controller.signal.aborted) return;
        const mode = requestedMode ?? defaultMode(from, to);
        update({ activeMode: mode, status: "routing" });
        const route = await fetchRoute(from, to, mode, controller.signal);
        update({ route: { ...route, from }, status: "ready", error: null });
      } catch (err) {
        if (err.name === "AbortError") return;
        update({ route: null, status: "error", error: err.message });
      }
    })();

    return () => controller.abort();
  }, [to, requestedMode]);

  const route = trip?.route;

  useEffect(() => {
    if (!map || !route) return;

    const draw = () => {
      try {
        drawRoute(map, route.geometry);
      } catch {
        // style still loading; the next styledata event retries
      }
    };
    // A theme switch replaces the style and drops our layers, so redraw them.
    const redrawIfMissing = () => {
      if (!map.getSource(ROUTE_ID)) draw();
    };

    draw();
    map.on("styledata", redrawIfMissing);
    const origin = new maplibregl.Marker({ element: originMarkerElement() })
      .setLngLat([route.from.lng, route.from.lat])
      .addTo(map);
    map.fitBounds(routeBounds(route.geometry), {
      padding: paddingRef.current,
      maxZoom: 16,
      duration: 800,
    });

    return () => {
      map.off("styledata", redrawIfMissing);
      origin.remove();
      removeRoute(map);
    };
  }, [map, route]);

  return { trip, start, setMode, clear };
}
