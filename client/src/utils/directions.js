import { Bike, Car, Footprints } from "lucide-react";

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export const travelModes = [
  { key: "walk", label: "Walk", Icon: Footprints, google: "walking" },
  { key: "drive", label: "Drive", Icon: Car, google: "driving" },
  { key: "bicycle", label: "Bike", Icon: Bike, google: "bicycling" },
];

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser can't share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Allow location access to get directions."
              : "Couldn't find your location."
          )
        ),
      // Reusing a recent fix keeps switching travel modes instant.
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Walk for short trips, drive otherwise.
export const defaultMode = (from, to) => (distanceKm(from, to) < 1.5 ? "walk" : "drive");

export async function fetchRoute(from, to, mode, signal) {
  const waypoints = `${from.lat},${from.lng}|${to.lat},${to.lng}`;
  const res = await fetch(
    `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(
      waypoints
    )}&mode=${mode}&apiKey=${GEOAPIFY_KEY}`,
    { signal }
  );
  const feature = res.ok ? (await res.json()).features?.[0] : null;
  if (!feature) throw new Error("No route found for this trip.");
  return {
    geometry: feature.geometry,
    distance: feature.properties.distance,
    time: feature.properties.time,
  };
}

// Turn-by-turn navigation is handed off to Google Maps (app or web);
// without an origin it starts from the user's current location.
export function googleMapsUrl(to, mode) {
  const travelmode = travelModes.find((m) => m.key === mode)?.google || "driving";
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=${travelmode}`;
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
