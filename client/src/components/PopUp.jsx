export default function PopUp({
  title,
  category,
  description,
  createdBy,
  likes,
  dislikes,
  id,
  imageUrl,
}) {
  return (
    <div className="pin-popup">
      <h2>{title || "no title"}</h2>
      {imageUrl && (
        <div
          style={{
            width: "100px",
            height: "100px",
            overflow: "hidden",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "0.5rem",
          }}
        >
          <img
            src={imageUrl}
            alt="Pin visual"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </div>
      )}
      <p>{description || "no description"}</p>
      <span className="category">{category || "no category"}</span>
      <p className="created-by">Created by: {createdBy}</p>
      <div className="popup-like">
        <span>👍 {likes}</span>
        <span>👎 {dislikes}</span>
      </div>
    </div>
  );
}
