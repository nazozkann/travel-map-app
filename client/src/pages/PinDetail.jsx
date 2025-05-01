import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DetailMap from "../components/DetailMap";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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
    tags: [],
  });
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showListFields, setShowListFields] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [extraImages, setExtraImages] = useState([]);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      fetch(import.meta.env.VITE_API_URL + `/api/lists/${username}`)
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
        tags: pin.tags || [],
      });
    }
  }, [pin]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + `/api/pins/${id}`)
      .then((res) => res.json())
      .then((data) => setPin(data));
  }, [id]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + `/api/comments/${id}`)
      .then((res) => res.json())
      .then((data) => setComments(data));
  }, [id]);

  async function handleLike() {
    const username = localStorage.getItem("username");
    const res = await fetch(
      import.meta.env.VITE_API_URL + `/api/pins/${id}/like`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      alert(data.message);
      return;
    }
    if (data._id) setPin(data);
  }

  async function handleDislike() {
    const username = localStorage.getItem("username");
    const res = await fetch(
      import.meta.env.VITE_API_URL + `/api/pins/${id}/dislike`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      alert(data.message);
      return;
    }
    if (data._id) setPin(data);
  }

  async function handleDelete(commentId) {
    const username = localStorage.getItem("username");
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );
      const result = await res.json();
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
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/api/pins/${pin._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );
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
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/comments", {
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
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/lists", {
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
    <div className="pin-detail-container">
      <div className="title-edit">
        <h1 className="pin-title">{pin.title}</h1>
        {localStorage.getItem("username") === pin.createdBy && (
          <button className="edit-button" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {pin.imageUrl && (
        <div className="pin-image-wrapper">
          <img src={pin.imageUrl} alt={pin.title} />
        </div>
      )}

      <div className="pin-meta">
        <div className="tag-list">
          {pin.tags.map((tag) => (
            <span key={tag} className={`tag tag-${tag}`}>
              {tag}
            </span>
          ))}
        </div>
        <div className="up-town">
          <p>
            <strong>Category:</strong> {pin.category}
          </p>
          <p>
            <strong>By:</strong> {pin.createdBy}
          </p>
        </div>
        <p>
          <strong>Description:</strong> {pin.description}
        </p>
      </div>

      <div className="pin-reactions">
        <button onClick={handleLike}>
          <IoIosThumbsUp style={{ width: "1.25rem", height: "auto" }} />
        </button>{" "}
        <span>{pin.likes}</span>
        <button onClick={handleDislike}>
          <IoIosThumbsDown style={{ width: "1.25rem", height: "auto" }} />
        </button>{" "}
        <span>{pin.dislikes}</span>
      </div>

      {Array.isArray(pin.images) && pin.images.length > 0 && (
        <div className="extra-images-slider">
          <button
            className="slider-arrow left"
            onClick={() =>
              setCurrentImageIndex((prev) =>
                prev === 0 ? pin.images.length - 1 : prev - 1
              )
            }
          >
            <FaArrowAltCircleLeft />
          </button>
          <img
            src={
              import.meta.env.VITE_API_URL + `${pin.images[currentImageIndex]}`
            }
            alt={`Extra ${currentImageIndex + 1}`}
            className="slider-image"
          />
          <button
            className="slider-arrow right"
            onClick={() =>
              setCurrentImageIndex((prev) =>
                prev === pin.images.length - 1 ? 0 : prev + 1
              )
            }
          >
            <FaArrowAltCircleRight />
          </button>
        </div>
      )}

      <DetailMap
        lat={pin.latitude}
        lng={pin.longitude}
        category={pin.category}
      />

      <div className="pin-lists">
        <div
          className="pin-lists-header"
          onClick={() => setShowListFields((prev) => !prev)}
        >
          <h3>Add to List</h3>
          <button className="plus-button">
            <Plus size={32} />
          </button>
        </div>

        {showListFields && (
          <div className="pin-lists-fields">
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

            <p className="create-new-list">Create new list:</p>
            <input
              type="text"
              placeholder="New list name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <button onClick={handleAddToList}>Add</button>
          </div>
        )}
      </div>
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form
              className="edit-form-vertical"
              onSubmit={async (e) => {
                e.preventDefault();
                const username = localStorage.getItem("username");

                let imageUrl = pin.imageUrl;
                let extraImageUrls = [...(pin.images || [])];

                const fileInput = e.target.elements.image;
                if (fileInput && fileInput.files.length > 0) {
                  const file = fileInput.files[0];
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("upload_preset", uploadPreset);
                  const res = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                      method: "POST",
                      body: formData,
                    }
                  );
                  const data = await res.json();
                  imageUrl = data.secure_url;
                }

                if (extraImages.length > 0) {
                  const uploads = await Promise.all(
                    extraImages.map(async (img) => {
                      const formData = new FormData();
                      formData.append("file", img);
                      formData.append(
                        "upload_preset",
                        "<CLOUDINARY_UPLOAD_PRESET>"
                      );
                      const res = await fetch(
                        `https://api.cloudinary.com/v1_1/<CLOUDINARY_CLOUD_NAME>/image/upload`,
                        {
                          method: "POST",
                          body: formData,
                        }
                      );
                      const data = await res.json();
                      return data.secure_url;
                    })
                  );
                  extraImageUrls = [...extraImageUrls, ...uploads];
                }

                const res = await fetch(
                  import.meta.env.VITE_API_URL + `/api/pins/${id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      username,
                      title: editForm.title,
                      category: editForm.category,
                      description: editForm.description,
                      tags: editForm.tags,
                      imageUrl,
                      images: extraImageUrls,
                    }),
                  }
                );

                const updated = await res.json();
                setPin(updated);
                setEditing(false);
              }}
            >
              <label>
                Title
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
              </label>

              <label>
                Category
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                />
              </label>
              <label>
                Tags
                <select
                  multiple
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      tags: Array.from(
                        e.target.selectedOptions,
                        (opt) => opt.value
                      ),
                    })
                  }
                >
                  <option value="free">Free</option>
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                  <option value="touristic">Touristic</option>
                  <option value="local">Local</option>
                  <option value="new">New</option>
                  <option value="crowded">Crowded</option>
                  <option value="quiet">Quiet</option>
                </select>
              </label>

              <label>
                Description
                <textarea
                  rows="4"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </label>

              <label>
                Cover Image
                <input type="file" name="image" accept="image/*" />
              </label>

              <label>
                Extra Images
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={(e) => setExtraImages([...e.target.files])}
                />
              </label>

              <button className="delete-button" onClick={handleDeletePin}>
                Delete Pin
              </button>

              <div className="edit-button-group">
                <button type="submit">Save</button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="list-comments-section">
        <h2>Comments</h2>
        <form className="list-comment-form" onSubmit={handleSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            required
          ></textarea>
          <button type="submit">Add Comment</button>
        </form>

        <ul className="list-comment-list">
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
              <li key={comment._id} className="list-comment-item">
                <div className="comment-header">
                  <strong>{comment.username}</strong>
                  <div className="comment-rigth-side">
                    <span>{formattedDate}</span>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="comment-delete-button"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
                <p>{comment.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
