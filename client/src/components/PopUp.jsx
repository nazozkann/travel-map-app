import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
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
      <span className="category">
        <img
          className="popup-icon"
          src={`/assets/icons/${category}.svg`}
          alt={category}
        />

        {category || "no category"}
      </span>
      <p>{description || "no description"}</p>
      <div className="popup-like">
        <span>
          <IoIosThumbsUp style={{ width: "1rem", height: "auto" }} /> {likes}
        </span>
        <span>
          <IoIosThumbsDown style={{ width: "1rem", height: "auto" }} />{" "}
          {dislikes}
        </span>
      </div>
    </div>
  );
}
