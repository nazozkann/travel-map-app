import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Heart, MapPinned, Pencil, Share2, User, UserPlus, X } from "lucide-react";
import ListMap from "../components/ListMap";
import NotFound from "./NotFound";
import Modal from "../components/Modal";
import Comments from "../components/Comments";
import PageStatus from "../components/PageStatus";
import { CardGrid, EmptyState, PlaceCard } from "../components/Cards";
import { api } from "../utils/api";
import useAuth from "../hooks/useAuth";
import useGoBack from "../hooks/useGoBack";
import uploadImage from "../utils/uploadImage";

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return window.prompt("Copy this link:", text) !== null;
}

export default function ListDetail() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const location = useLocation();
  const username = useAuth();
  const goBack = useGoBack();
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [listComments, setListComments] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

  const isShared = location.pathname.startsWith("/share");

  useEffect(() => {
    setList(null);
    setLoadError(null);
    const endpoint = isShared
      ? `/api/lists/share/${listId}`
      : `/api/lists/id/${listId}`;
    api(endpoint).then(setList).catch(setLoadError);
  }, [listId, isShared]);

  useEffect(() => {
    api(`/api/lists/${listId}/comments`)
      .then(setListComments)
      .catch((err) => console.error("List comments fetch error:", err));
  }, [listId]);

  const validPins = useMemo(
    () => (Array.isArray(list?.pins) ? list.pins.filter(Boolean) : []),
    [list?.pins]
  );

  const isOwner = Boolean(username) && username === list?.createdBy;
  const isCollaborator =
    Boolean(username) && Boolean(list?.collaborators?.includes(username));
  const canEdit = isOwner || isCollaborator;
  const hasPendingRequest =
    requestSent ||
    Boolean(
      list?.collabRequests?.some(
        (r) => r.username === username && r.status === "pending"
      )
    );

  function requireLogin(message) {
    if (username) return true;
    alert(message);
    navigate("/auth");
    return false;
  }

  async function handleRemovePin(pinId) {
    try {
      const updated = await api(`/api/lists/${listId}/remove-pin`, {
        method: "PUT",
        auth: true,
        body: { pinId },
      });
      setList(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleShareList() {
    const shareUrl = `${window.location.origin}/share/${listId}`;
    try {
      if (await copyToClipboard(shareUrl)) {
        alert("✅ Share link copied to clipboard!");
      }
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  async function handleAddComment(text) {
    if (!requireLogin("You need to be logged in to comment.")) return false;

    try {
      const addedComment = await api(`/api/lists/${listId}/comments`, {
        method: "POST",
        auth: true,
        body: { text },
      });
      setListComments((prev) => [addedComment, ...prev]);
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(error.message);
      return false;
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api(`/api/lists/${listId}/comments/${commentId}`, {
        method: "DELETE",
        auth: true,
      });
      setListComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert(err.message);
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleLikeList() {
    if (!requireLogin("You need to be logged in to like a list.")) return;
    try {
      const updated = await api(`/api/lists/${listId}/like`, {
        method: "PUT",
        auth: true,
      });
      setList((prev) => ({
        ...prev,
        likes: updated.likes,
        likedBy: updated.likedBy,
      }));
    } catch (err) {
      console.error("Error liking list:", err);
      alert(err.message);
    }
  }

  async function handleSendCollabRequest() {
    if (!requireLogin("You need to be logged in to collaborate.")) return;
    try {
      await api(`/api/lists/${listId}/request-collab`, {
        method: "PUT",
        auth: true,
      });
      alert("Request sent!");
      setRequestSent(true);
    } catch (err) {
      console.error("Error sending request:", err);
      alert(err.message);
    }
  }

  function openEditor() {
    setEditForm({ name: list.name, description: list.description || "" });
    setCoverImageFile(null);
    setEditing(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const coverImage = coverImageFile
        ? await uploadImage(coverImageFile)
        : undefined;
      const updated = await api(`/api/lists/${listId}`, {
        method: "PUT",
        auth: true,
        body: { ...editForm, coverImage },
      });
      setList(updated);
      setEditing(false);
    } catch (err) {
      console.error("List update failed:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <NotFound
        message={
          loadError.status === 404 || loadError.status === 400
            ? "List not found"
            : "Couldn't load this list"
        }
      />
    );
  }
  if (!list) return <PageStatus />;

  const likedByMe = Boolean(username) && list.likedBy?.includes(username);

  return (
    <main className="page">
      <button type="button" className="btn btn-ghost back-btn" onClick={goBack}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </button>

      {list.coverImage && (
        <div className="hero-media hero-media-wide">
          <img src={list.coverImage} alt="" />
        </div>
      )}

      <header className="detail-header">
        <span className="eyebrow">List</span>
        <h1 className="detail-title">{list.name}</h1>
        <p className="detail-meta">
          <span>
            <User size={15} aria-hidden="true" />
            <Link to={`/profile/${encodeURIComponent(list.createdBy)}`} className="link">
              {list.createdBy}
            </Link>
          </span>
          <span>
            <MapPinned size={15} aria-hidden="true" />
            {validPins.length} place{validPins.length === 1 ? "" : "s"}
          </span>
        </p>
        {list.description && <p className="detail-description">{list.description}</p>}

        <div className="detail-actions">
          <button
            className={`btn btn-secondary vote-btn ${likedByMe ? "voted" : ""}`}
            onClick={handleLikeList}
            aria-pressed={likedByMe}
            aria-label={likedByMe ? "Unlike list" : "Like list"}
          >
            <Heart size={17} aria-hidden="true" fill={likedByMe ? "currentColor" : "none"} />
            {list.likes}
          </button>
          {!isShared && (
            <button className="btn btn-secondary" onClick={handleShareList}>
              <Share2 size={16} aria-hidden="true" />
              Share
            </button>
          )}
          <span className="spacer" />
          {!isShared && canEdit && (
            <button className="btn btn-secondary" onClick={openEditor}>
              <Pencil size={16} aria-hidden="true" />
              Edit
            </button>
          )}
          {!isShared && username && !canEdit && (
            <button
              className="btn btn-secondary"
              onClick={handleSendCollabRequest}
              disabled={hasPendingRequest}
            >
              <UserPlus size={16} aria-hidden="true" />
              {hasPendingRequest ? "Request pending" : "Collaborate"}
            </button>
          )}
        </div>
      </header>

      {validPins.length > 0 && <ListMap pins={validPins} />}

      <section className="section">
        <h2 className="section-title">Places</h2>
        {validPins.length === 0 ? (
          <EmptyState icon={MapPinned} title="This list has no places yet">
            Open a place on the map and add it to this list.
          </EmptyState>
        ) : (
          <CardGrid>
            {validPins.map((pin) => (
              <PlaceCard key={pin._id} pin={pin} />
            ))}
          </CardGrid>
        )}
      </section>

      <Comments
        comments={listComments}
        username={username}
        onAdd={handleAddComment}
        onDelete={setConfirmDeleteId}
        placeholder="Write a comment about this list..."
      />

      {editing && (
        <Modal title="Edit list" onClose={() => setEditing(false)}>
          <form className="form" onSubmit={handleSaveEdit}>
            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="input"
                type="text"
                required
                maxLength={100}
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                className="input"
                rows={3}
                maxLength={1000}
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
                onChange={(e) => setCoverImageFile(e.target.files[0] || null)}
              />
            </label>

            {validPins.length > 0 && (
              <div className="field">
                <span className="field-label">Places</span>
                <ul className="row-list">
                  {validPins.map((pin) => (
                    <li key={pin._id} className="row-item">
                      <Link to={`/places/${pin._id}`} className="row-item-title">
                        {pin.title}
                      </Link>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        aria-label={`Remove ${pin.title} from list`}
                        onClick={() => handleRemovePin(pin._id)}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-actions">
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

      {confirmDeleteId && (
        <Modal title="Delete comment?" size="sm" onClose={() => setConfirmDeleteId(null)}>
          <p className="muted">This can’t be undone.</p>
          <div className="form-actions">
            <span className="spacer" />
            <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDeleteComment(confirmDeleteId)}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
