export default function PopUp({
  title,
  category,
  description,
  createdBy,
  likes,
  dislikes,
  id,
}) {
  async function handleLike() {
    try {
      await fetch(`/api/pins/${id}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error liking pin:", error);
    }
  }
  async function handleDislike() {
    try {
      await fetch(`/api/pins/${id}/dislike`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error disliking pin:", error);
    }
  }
  return (
    <div className="pin-popup">
      <h2>{title || "no title"}</h2>
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
