import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PinDetail() {
  const { id } = useParams();
  const [pin, setPin] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/api/pins/${id}`)
      .then((res) => res.json())
      .then((data) => setPin(data));
  }, [id]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/comments/${id}`)
      .then((res) => res.json())
      .then((data) => setComments(data));
  }, [id]);

  async function handleLike() {
    const res = await fetch(`http://localhost:8000/api/pins/${id}/like`, {
      method: "PUT",
    });
    const updatedData = await res.json();
    setPin(updatedData);
  }

  async function handleDislike() {
    const res = await fetch(`http://localhost:8000/api/pins/${id}/dislike`, {
      method: "PUT",
    });
    const updatedData = await res.json();
    setPin(updatedData);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const username = localStorage.getItem("username") || "anonymous";

    console.log("🎯 Gönderilen veri:", {
      pinId: id,
      username,
      text: newComment,
    });

    const res = await fetch("http://localhost:8000/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pinId: id,
        username,
        text: newComment,
      }),
    });

    const added = await res.json();
    setComments((prev) => [added, ...prev]);
    setNewComment("");
  }

  if (!pin) return <p>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{pin.title}</h2>
      <p>
        <strong>Category:</strong> {pin.category}
      </p>
      <p>
        <strong>By:</strong> {pin.createdBy}
      </p>
      <p>
        <strong>Description:</strong> {pin.description}
      </p>
      <div>
        <button onClick={handleLike}>👍</button>
        <p>{pin.likes}</p>
      </div>
      <div>
        <button onClick={handleDislike}>👎</button>
        <p>{pin.dislikes}</p>
      </div>
      <div className="comment-area">
        <h2>Comments</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            name="comment"
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          ></textarea>
          <button type="submit">Add Comment</button>
        </form>
        <ul>
          {comments.map((comment) => {
            return (
              <li key={comment._id}>
                <p>{comment.username}</p>
                <p>{comment.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
