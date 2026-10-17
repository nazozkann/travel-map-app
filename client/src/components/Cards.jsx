import { Link } from "react-router-dom";
import { MapPin, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { getCategory } from "../utils/categories";

export function CategoryBadge({ category, className = "" }) {
  const { key, label, Icon } = getCategory(category);
  return (
    <span className={`badge badge-cat ${className}`} style={{ "--c": `var(--cat-${key})` }}>
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Votes({ likes = 0, dislikes = 0 }) {
  return (
    <span className="votes">
      <span>
        <ThumbsUp size={15} aria-label="Likes" /> {likes}
      </span>
      <span>
        <ThumbsDown size={15} aria-label="Dislikes" /> {dislikes}
      </span>
    </span>
  );
}

function CardMedia({ src, alt, category }) {
  const { key, Icon } = getCategory(category);
  return (
    <div className="card-media">
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="card-media-empty" style={{ "--c": `var(--cat-${key})` }}>
          <Icon size={32} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function PlaceCard({ pin, onRemove }) {
  return (
    <div className="card">
      <Link to={`/places/${pin._id}`} className="card-link">
        <CardMedia src={pin.imageUrl} alt={pin.title} category={pin.category} />
        <div className="card-body">
          <CategoryBadge category={pin.category} />
          <h3 className="card-title">{pin.title}</h3>
          {pin.city && pin.city !== "Unknown" && (
            <p className="card-sub">
              <MapPin size={14} aria-hidden="true" />
              {pin.city}
            </p>
          )}
          {pin.description && <p className="card-text">{pin.description}</p>}
          <div className="card-footer">
            <Votes likes={pin.likes} dislikes={pin.dislikes} />
          </div>
        </div>
      </Link>
      {onRemove && (
        <button
          type="button"
          className="icon-btn card-remove"
          aria-label={`Remove ${pin.title}`}
          onClick={() => onRemove(pin._id)}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function ListCard({ list }) {
  const count = list.pins?.filter(Boolean).length || 0;
  const cover = list.coverImage || list.pins?.find((p) => p?.imageUrl)?.imageUrl;
  return (
    <div className="card">
      <Link to={`/lists/${list._id}`} className="card-link">
        <CardMedia src={cover} alt={list.name} category="other" />
        <div className="card-body">
          <h3 className="card-title">{list.name}</h3>
          {list.description && <p className="card-text">{list.description}</p>}
          <div className="card-footer">
            <span className="muted">
              {count} place{count === 1 ? "" : "s"}
            </span>
            {list.createdBy && <span className="muted">by {list.createdBy}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function CardGrid({ children }) {
  return <div className="card-grid">{children}</div>;
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-state-icon">
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <p className="empty-state-title">{title}</p>
      {children && <div className="empty-state-text">{children}</div>}
    </div>
  );
}
