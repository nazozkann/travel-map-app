import { Navigation, X } from "lucide-react";
import {
  formatDistance,
  formatDuration,
  googleMapsUrl,
  travelModes,
} from "../utils/directions";

// Summary of a useDirections() trip: travel mode, time/distance and a hand-off to Google Maps.
export default function DirectionsCard({ trip, onModeChange, onClose, className = "" }) {
  const { to, activeMode, status, route, error } = trip;

  return (
    <div className={`directions-card ${className}`}>
      <div className="directions-head">
        <div className="directions-heading">
          <span className="directions-label">Directions to</span>
          <span className="directions-title">{to.title || "this place"}</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close directions"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="segmented directions-modes" role="tablist" aria-label="Travel mode">
        {travelModes.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeMode === key}
            className={activeMode === key ? "active" : ""}
            disabled={status === "locating"}
            onClick={() => onModeChange(key)}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <p className="directions-summary" role="status" aria-live="polite">
        {status === "locating" && <span className="muted">Finding your location…</span>}
        {status === "routing" && <span className="muted">Finding the best route…</span>}
        {status === "ready" && route && (
          <>
            <strong>{formatDuration(route.time)}</strong>
            <span className="muted">{formatDistance(route.distance)}</span>
          </>
        )}
        {status === "error" && <span className="directions-error">{error}</span>}
      </p>

      <a
        className="btn btn-primary btn-block"
        href={googleMapsUrl(to, activeMode)}
        target="_blank"
        rel="noreferrer"
      >
        <Navigation size={17} aria-hidden="true" />
        Start in Google Maps
      </a>
    </div>
  );
}
