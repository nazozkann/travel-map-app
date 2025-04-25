import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DetailMap from "../components/DetailMap";
import { useNavigate } from "react-router-dom";

export default function PinDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pin, setPin] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
  });
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      fetch(`http://localhost:8000/api/lists/${username}`)
        .then((res) => res.json())
        .then((data) => setLists(data));
    }
  }, []);

  useEffect(() => {
    if (pin) {
      setEditForm({
        title: pin.title,
        category: pin.category,
        description: pin.description,
      });
    }
  }, [pin]);

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
    const username = localStorage.getItem("username");
    const res = await fetch(`http://localhost:8000/api/pins/${id}/like`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    if (data._id) {
      setPin(data);
    }
  }

  async function handleDislike() {
    const username = localStorage.getItem("username");
    const res = await fetch(`http://localhost:8000/api/pins/${id}/dislike`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    if (data._id) {
      setPin(data);
    }
  }

  async function handleDelete(commentId) {
    const username = localStorage.getItem("username");
    try {
      const res = await fetch(
        `http://localhost:8000/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );

      const result = res.json();

      if (res.ok) {
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentId)
        );
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  }

  async function handleDeletePin() {
    const confirmDelete = confirm("Are you sure you want to delete this pin?");
    if (!confirmDelete) return;

    const username = localStorage.getItem("username");

    try {
      const res = await fetch(`http://localhost:8000/api/pins/${pin._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Pin deleted!");

        window.location.href = "/";
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("❌ Silme hatası:", err);
      alert("Error deleting pin.");
    }
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

  async function handleAddToList() {
    const username = localStorage.getItem("username");
    if (!username) return alert("You need to be logged in");

    try {
      let listIdToUse = selectedListId;

      if (!listIdToUse && newListName) {
        const res = await fetch("http://localhost:8000/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newListName,
            description: "",
            createdBy: username,
            pins: [],
          }),
        });
        const newList = await res.json();
        listIdToUse = newList._id;
      }
      if (!listIdToUse) return alert("Select or create a list");

      navigate(`/lists/${listIdToUse}?pin=${id}`);
    } catch (err) {
      console.error("Error while adding to list:", err);
    }
  }

  if (!pin) return <p>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <div>
        {localStorage.getItem("username") === pin.createdBy && (
          <button
            style={{ background: "red", color: "white", marginTop: "1rem" }}
            onClick={handleDeletePin}
          >
            Delete this place
          </button>
        )}
      </div>
      <div>
        {localStorage.getItem("username") === pin.createdBy && (
          <button
            style={{ background: "red", color: "white", marginTop: "1rem" }}
            onClick={() => setEditing(true)}
          >
            Edit this place
          </button>
        )}
      </div>
      <div>
        {editing && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const username = localStorage.getItem("username");
              const res = await fetch(`http://localhost:8000/api/pins/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, ...editForm }),
              });
              const updated = await res.json();
              setPin(updated);
              setEditing(false);
            }}
          >
            <input
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
            />
            <input
              value={editForm.category}
              onChange={(e) =>
                setEditForm({ ...editForm, category: e.target.value })
              }
            />
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            ></textarea>
            <button type="submit">Save</button>
          </form>
        )}
      </div>
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
      <DetailMap
        lat={pin.latitude}
        lng={pin.longitude}
        category={pin.category}
      />
      <div>
        <h3>Add to List</h3>
        <select
          value={selectedListId}
          onChange={(e) => setSelectedListId(e.target.value)}
        >
          <option value="">Select a list</option>
          {lists.map((list) => (
            <option key={list._id} value={list._id}>
              {list.name}
            </option>
          ))}
        </select>

        <p style={{ marginTop: "1rem" }}>or create new list</p>
        <input
          type="text"
          placeholder="New list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />

        <button onClick={handleAddToList}>Add</button>
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
            const date = new Date(comment.createdAt);
            const formattedDate = date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            const isOwner =
              localStorage.getItem("username") === comment.username;
            return (
              <li key={comment._id}>
                <p>{comment.username}</p>
                <p>{comment.text}</p>
                <p>{formattedDate}</p>
                {isOwner && (
                  <button onClick={() => handleDelete(comment._id)}>
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
