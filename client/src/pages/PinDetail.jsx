import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DetailMap from "../components/DetailMap";
import NotFound from "./NotFound";
import { Plus } from "lucide-react";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
import { api } from "../utils/api";
import useAuth from "../hooks/useAuth";
import uploadImage from "../utils/uploadImage";
import { categories, categoryLabel } from "../utils/categories";
import { tags as allTags } from "../utils/tags";
import formatDate from "../utils/formatDate";

export default function PinDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const username = useAuth();
  const [pin, setPin] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const [coverImage, setCoverImage] = useState(null);
  const [extraImages, setExtraImages] = useState([]);

  useEffect(() => {
    if (!username) {
      setLists([]);
      return;
    }
    api(`/api/lists/${encodeURIComponent(username)}`)
      .then((data) =>
        // Only lists the user can actually add pins to.
        setLists(
          data.filter(
            (l) =>
              l.createdBy === username || l.collaborators?.includes(username)
          )
        )
      )
      .catch((err) => console.error("Lists couldn't be loaded:", err));
  }, [username]);

  useEffect(() => {
    setPin(null);
    setLoadError(null);
    setCurrentImageIndex(0);
    api(`/api/pins/${id}`)
      .then(setPin)
      .catch((err) => setLoadError(err));
  }, [id]);

  useEffect(() => {
    api(`/api/comments/${id}`)
      .then(setComments)
      .catch((err) => console.error("Comments couldn't be loaded:", err));
  }, [id]);

  function requireLogin(message) {
    if (username) return true;
    alert(message);
    navigate("/auth");
    return false;
  }

  async function handleVote(type) {
    if (!requireLogin("You need to be logged in to vote")) return;
    try {
      const updated = await api(`/api/pins/${id}/${type}`, {
        method: "PUT",
        auth: true,
      });
      setPin(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(commentId) {
    try {
      await api(`/api/comments/${commentId}`, { method: "DELETE", auth: true });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert(err.message);
    }
  }

  async function handleDeletePin() {
    if (!confirm("Are you sure you want to delete this pin?")) return;
    try {
      await api(`/api/pins/${pin._id}`, { method: "DELETE", auth: true });
      alert("Pin deleted!");
      navigate("/");
    } catch (err) {
      console.error("❌ Silme hatası:", err);
      alert(err.message || "Error deleting pin.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!requireLogin("You need to be logged in to comment")) return;
    try {
      const added = await api("/api/comments", {
        method: "POST",
        auth: true,
        body: { pinId: id, text: newComment },
      });
      setComments((prev) => [added, ...prev]);
      setNewComment("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddToList() {
    if (!requireLogin("You need to be logged in")) return;

    try {
      let listIdToUse = selectedListId;
      if (!listIdToUse && newListName.trim()) {
        const newList = await api("/api/lists", {
          method: "POST",
          auth: true,
          body: { name: newListName.trim(), description: "" },
        });
        listIdToUse = newList._id;
      }
      if (!listIdToUse) return alert("Select or create a list");

      await api(`/api/lists/${listIdToUse}/add-pin`, {
        method: "PUT",
        auth: true,
        body: { pinId: id },
      });
      navigate(`/lists/${listIdToUse}`);
    } catch (err) {
      console.error("Error while adding to list:", err);
      alert(err.message);
    }
  }

  function openEditor() {
    setEditForm({
      title: pin.title,
      category: pin.category,
      description: pin.description || "",
      tags: pin.tags || [],
    });
    setCoverImage(null);
    setExtraImages([]);
    setEditing(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const imageUrl = coverImage ? await uploadImage(coverImage) : pin.imageUrl;
      const uploads = await Promise.all(extraImages.map(uploadImage));

      const updated = await api(`/api/pins/${id}`, {
        method: "PUT",
        auth: true,
        body: {
          ...editForm,
          imageUrl,
          images: [...(pin.images || []), ...uploads],
        },
      });
      setPin(updated);
      setEditing(false);
    } catch (err) {
      console.error("Pin update failed:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveImage(url) {
    if (!confirm("Remove this image?")) return;
    try {
      const updated = await api(`/api/pins/${id}`, {
        method: "PUT",
        auth: true,
        body: { images: pin.images.filter((img) => img !== url) },
      });
      setPin(updated);
      setCurrentImageIndex(0);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loadError) {
    return (
      <NotFound
        message={
          loadError.status === 404 || loadError.status === 400
            ? "Place not found"
            : "Couldn't load this place"
        }
      />
    );
  }
  if (!pin) return <p className="page-status">Loading...</p>;

  const isOwner = username === pin.createdBy;
  const images = Array.isArray(pin.images) ? pin.images : [];
  const safeImageIndex = Math.min(currentImageIndex, images.length - 1);

  return (
    <div className="pin-detail-container">
      <div className="title-edit">
        <h1 className="pin-title">{pin.title}</h1>
        {isOwner && (
          <button className="edit-button" onClick={openEditor}>
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
          {(pin.tags || []).map((tag) => (
            <span key={tag} className={`tag tag-${tag}`}>
              {tag}
            </span>
          ))}
        </div>
        <div className="up-town">
          <p>
            <strong>Category:</strong> {categoryLabel(pin.category)}
          </p>
          {pin.city && pin.city !== "Unknown" && (
            <p>
              <strong>City:</strong> {pin.city}
            </p>
          )}
          <p
            style={{ cursor: "pointer" }}
            onClick={() =>
              navigate(`/profile/${encodeURIComponent(pin.createdBy)}`)
            }
          >
            <strong>By:</strong> {pin.createdBy}
          </p>
        </div>
        <p>
          <strong>Description:</strong> {pin.description}
        </p>
      </div>

      <div className="pin-reactions">
        <button
          onClick={() => handleVote("like")}
          aria-label="Like"
          aria-pressed={pin.likedBy?.includes(username)}
          className={pin.likedBy?.includes(username) ? "voted" : ""}
        >
          <IoIosThumbsUp style={{ width: "1.25rem", height: "auto" }} />
        </button>{" "}
        <span>{pin.likes}</span>
        <button
          onClick={() => handleVote("dislike")}
          aria-label="Dislike"
          aria-pressed={pin.dislikedBy?.includes(username)}
          className={pin.dislikedBy?.includes(username) ? "voted" : ""}
        >
          <IoIosThumbsDown style={{ width: "1.25rem", height: "auto" }} />
        </button>{" "}
        <span>{pin.dislikes}</span>
      </div>

      {images.length > 0 && (
        <div className="extra-images-slider">
          {images.length > 1 && (
            <button
              className="slider-arrow left"
              aria-label="Previous image"
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev <= 0 ? images.length - 1 : prev - 1
                )
              }
            >
              <FaArrowAltCircleLeft />
            </button>
          )}
          <img
            src={images[safeImageIndex]}
            alt={`${pin.title} ${safeImageIndex + 1}`}
            className="slider-image"
          />
          {images.length > 1 && (
            <button
              className="slider-arrow right"
              aria-label="Next image"
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev >= images.length - 1 ? 0 : prev + 1
                )
              }
            >
              <FaArrowAltCircleRight />
            </button>
          )}
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
          <button
            className="plus-button"
            aria-label="Add to list"
            aria-expanded={showListFields}
          >
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
              maxLength={100}
              value={newListName}
              disabled={Boolean(selectedListId)}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <button onClick={handleAddToList}>Add</button>
          </div>
        )}
      </div>
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form className="edit-form-vertical" onSubmit={handleSaveEdit}>
              <label>
                Title
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
              </label>

              <label>
                Category
                <select
                  required
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
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
                  {allTags.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  rows="4"
                  maxLength={2000}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </label>

              <label>
                Cover Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files[0] || null)}
                />
              </label>

              <label>
                Extra Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setExtraImages([...e.target.files])}
                />
              </label>

              {images.length > 0 && (
                <div className="edit-image-list">
                  {images.map((url) => (
                    <button
                      type="button"
                      key={url}
                      className="edit-image-thumb"
                      title="Remove image"
                      onClick={() => handleRemoveImage(url)}
                    >
                      <img src={url} alt="" />
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="delete-button"
                onClick={handleDeletePin}
              >
                Delete Pin
              </button>

              <div className="edit-button-group">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
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
        {username ? (
          <form className="list-comment-form" onSubmit={handleSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={1000}
              required
            ></textarea>
            <button type="submit">Add Comment</button>
          </form>
        ) : (
          <p>
            <Link to="/auth">Log in</Link>{" "}
            to leave a comment.
          </p>
        )}

        <ul className="list-comment-list">
          {comments.map((comment) => (
            <li key={comment._id} className="list-comment-item">
              <div className="comment-header">
                <strong
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/profile/${encodeURIComponent(comment.username)}`)
                  }
                >
                  {comment.username}
                </strong>
                <div className="comment-rigth-side">
                  <span>{formatDate(comment.createdAt)}</span>
                  {username === comment.username && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="comment-delete-button"
                      aria-label="Delete comment"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>
              <p>{comment.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
