import { MapPin, Navigation } from "lucide-react";
import { CategoryBadge, Votes } from "./Cards";

// Preview shown above a map marker. The whole card opens the place.
export default function PopUp({ pin, onOpen, onDirections }) {
  const { title, category, city, description, likes, dislikes, imageUrl } = pin;

  return (
    <div className="pin-popup">
      <button type="button" className="pin-popup-main" onClick={onOpen}>
        {imageUrl && (
          // Photo is shown whole (contain) over a blurred copy, so nothing gets cropped.
          <span className="pin-popup-media">
            <img src={imageUrl} alt="" aria-hidden="true" className="pin-popup-backdrop" />
            <img src={imageUrl} alt="" className="pin-popup-img" />
          </span>
        )}
        <span className="pin-popup-body">
          <CategoryBadge category={category} />
          <span className="pin-popup-title">{title || "Untitled"}</span>
          {city && city !== "Unknown" && (
            <span className="pin-popup-city">
              <MapPin size={13} aria-hidden="true" />
              {city}
            </span>
          )}
          {description && <span className="pin-popup-text">{description}</span>}
        </span>
      </button>
      <div className="pin-popup-footer">
        <Votes likes={likes} dislikes={dislikes} />
        <button type="button" className="btn btn-sm btn-secondary" onClick={onDirections}>
          <Navigation size={14} aria-hidden="true" />
          Directions
        </button>
      </div>
    </div>
  );
}
