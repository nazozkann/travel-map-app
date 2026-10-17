import { CategoryBadge, Votes } from "./Cards";

// Hover preview shown above a map marker.
export default function PopUp({
  title,
  category,
  description,
  likes,
  dislikes,
  imageUrl,
}) {
  return (
    <div className="pin-popup">
      {imageUrl && <img src={imageUrl} alt="" className="pin-popup-img" />}
      <div className="pin-popup-body">
        <CategoryBadge category={category} />
        <h3>{title || "Untitled"}</h3>
        {description && <p>{description}</p>}
        <Votes likes={likes} dislikes={dislikes} />
      </div>
    </div>
  );
}
