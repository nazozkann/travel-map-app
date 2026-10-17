import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  MapPin,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  X,
} from "lucide-react";
import DetailMap from "../components/DetailMap";
import NotFound from "./NotFound";
import Modal from "../components/Modal";
import Comments from "../components/Comments";
import PageStatus from "../components/PageStatus";
import TagPicker from "../components/TagPicker";
import { CategoryBadge } from "../components/Cards";
import { api } from "../utils/api";
import useAuth from "../hooks/useAuth";
import useGoBack from "../hooks/useGoBack";
import uploadImage from "../utils/uploadImage";
import { categories } from "../utils/categories";
import { tags as allTags } from "../utils/tags";

export default function PinDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const username = useAuth();
  const goBack = useGoBack();
  const [pin, setPin] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [comments, setComments] = useState([]);
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
      console.error("Pin delete failed:", err);
      alert(err.message || "Error deleting pin.");
    }
  }

  async function handleAddComment(text) {
    if (!requireLogin("You need to be logged in to comment")) return false;
    try {
      const added = await api("/api/comments", {
        method: "POST",
        auth: true,
        body: { pinId: id, text },
      });
      setComments((prev) => [added, ...prev]);
      return true;
    } catch (err) {
      alert(err.message);
      return false;
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
  if (!pin) return <PageStatus />;

  const isOwner = username === pin.createdBy;
  const images = Array.isArray(pin.images) ? pin.images : [];
  const safeImageIndex = Math.min(currentImageIndex, images.length - 1);

  const likedByMe = Boolean(username) && pin.likedBy?.includes(username);
  const dislikedByMe = Boolean(username) && pin.dislikedBy?.includes(username);
  const tagLabel = (key) => allTags.find((t) => t.key === key)?.label || key;

  return (
    <main className="page page-narrow">
      <button type="button" className="btn btn-ghost back-btn" onClick={goBack}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </button>

      <header className="detail-header">
        <CategoryBadge category={pin.category} />
        <h1 className="detail-title">{pin.title}</h1>
        <p className="detail-meta">
          {pin.city && pin.city !== "Unknown" && (
            <span>
              <MapPin size={15} aria-hidden="true" />
              {pin.city}
            </span>
          )}
          <span>
            <User size={15} aria-hidden="true" />
            <Link to={`/profile/${encodeURIComponent(pin.createdBy)}`} className="link">
              {pin.createdBy}
            </Link>
          </span>
        </p>

        <div className="detail-actions">
          <button
            className={`btn btn-secondary vote-btn ${likedByMe ? "voted" : ""}`}
            onClick={() => handleVote("like")}
            aria-label="Like"
            aria-pressed={likedByMe}
          >
            <ThumbsUp size={17} aria-hidden="true" />
            {pin.likes}
          </button>
          <button
            className={`btn btn-secondary vote-btn ${dislikedByMe ? "voted" : ""}`}
            onClick={() => handleVote("dislike")}
            aria-label="Dislike"
            aria-pressed={dislikedByMe}
          >
            <ThumbsDown size={17} aria-hidden="true" />
            {pin.dislikes}
          </button>
          <span className="spacer" />
          {isOwner && (
            <button className="btn btn-secondary" onClick={openEditor}>
              <Pencil size={16} aria-hidden="true" />
              Edit
            </button>
          )}
        </div>
      </header>

      {pin.imageUrl && (
        <div className="hero-media">
          <img src={pin.imageUrl} alt={pin.title} />
        </div>
      )}

      {(pin.tags || []).length > 0 && (
        <div className="chip-wrap">
          {pin.tags.map((tag) => (
            <span key={tag} className="chip chip-sm chip-static">
              {tagLabel(tag)}
            </span>
          ))}
        </div>
      )}

      {pin.description && <p className="detail-description">{pin.description}</p>}

      {images.length > 0 && (
        <section className="section">
          <h2 className="section-title">Photos</h2>
          <div className="gallery">
            <img
              src={images[safeImageIndex]}
              alt={`${pin.title} ${safeImageIndex + 1}`}
            />
            {images.length > 1 && (
              <>
                <button
                  className="gallery-arrow left"
                  aria-label="Previous image"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev <= 0 ? images.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="gallery-arrow right"
                  aria-label="Next image"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev >= images.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <ChevronRight size={20} />
                </button>
                <span className="gallery-count">
                  {safeImageIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Location</h2>
        <DetailMap
          lat={pin.latitude}
          lng={pin.longitude}
          category={pin.category}
          title={pin.title}
        />
      </section>

      <section className="section panel">
        <button
          type="button"
          className="panel-toggle"
          aria-expanded={showListFields}
          onClick={() => setShowListFields((prev) => !prev)}
        >
          <ListPlus size={20} aria-hidden="true" />
          <span>Add to a list</span>
          {showListFields ? <X size={18} /> : <ChevronRight size={18} />}
        </button>

        {showListFields && (
          <div className="list-picker">
            <label className="field">
              <span className="field-label">Your lists</span>
              <select
                className="input"
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
            </label>
            <label className="field">
              <span className="field-label">Or create a new one</span>
              <input
                className="input"
                type="text"
                placeholder="New list name"
                maxLength={100}
                value={newListName}
                disabled={Boolean(selectedListId)}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </label>
            <button className="btn btn-primary" onClick={handleAddToList}>
              Add to list
            </button>
          </div>
        )}
      </section>

      <Comments
        comments={comments}
        username={username}
        onAdd={handleAddComment}
        onDelete={handleDelete}
        placeholder="Share your thoughts..."
      />

      {editing && (
        <Modal title="Edit place" onClose={() => setEditing(false)}>
          <form className="form" onSubmit={handleSaveEdit}>
            <label className="field">
              <span className="field-label">Title</span>
              <input
                className="input"
                type="text"
                required
                maxLength={120}
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </label>

            <label className="field">
              <span className="field-label">Category</span>
              <select
                className="input"
                required
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="field">
              <span className="field-label">Tags</span>
              <TagPicker
                value={editForm.tags}
                onChange={(tags) => setEditForm({ ...editForm, tags })}
              />
            </div>

            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                className="input"
                rows="4"
                maxLength={5000}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </label>

            <label className="field">
              <span className="field-label">Cover image</span>
              <input
                className="input file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files[0] || null)}
              />
            </label>

            <label className="field">
              <span className="field-label">Add photos</span>
              <input
                className="input file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setExtraImages([...e.target.files])}
              />
            </label>

            {images.length > 0 && (
              <div className="field">
                <span className="field-label">Photos · tap to remove</span>
                <div className="thumb-list">
                  {images.map((url) => (
                    <button
                      type="button"
                      key={url}
                      className="thumb"
                      title="Remove image"
                      onClick={() => handleRemoveImage(url)}
                    >
                      <img src={url} alt="" />
                      <span aria-hidden="true">
                        <X size={18} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-danger-ghost" onClick={handleDeletePin}>
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
              <span className="spacer" />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
