import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import ListMap from "../components/ListMap";
import NotFound from "./NotFound";
import { X } from "lucide-react";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
import { api } from "../utils/api";
import useAuth from "../hooks/useAuth";
import uploadImage from "../utils/uploadImage";
import formatDate from "../utils/formatDate";
import { categoryLabel } from "../utils/categories";

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
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [listComments, setListComments] = useState([]);
  const [newListComment, setNewListComment] = useState("");
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

  async function handleAddComment(e) {
    e.preventDefault();
    if (!requireLogin("You need to be logged in to comment.")) return;

    try {
      const addedComment = await api(`/api/lists/${listId}/comments`, {
        method: "POST",
        auth: true,
        body: { text: newListComment },
      });
      setListComments((prev) => [addedComment, ...prev]);
      setNewListComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(error.message);
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
  if (!list) return <p className="page-status">Loading list...</p>;

  const likedByMe = Boolean(username) && list.likedBy?.includes(username);

  return (
    <div className="pin-detail-container">
      <div className="title-edit">
        <h1 className="pin-title">{list.name}</h1>
      </div>

      {list.coverImage && (
        <div className="cover-image-container">
          <img src={list.coverImage} alt="Cover" />
        </div>
      )}

      <p>{list.description}</p>

      <div className="list-detail-bottom">
        <p style={{ marginBottom: "1rem" }}>
          Created by{" "}
          <Link to={`/profile/${encodeURIComponent(list.createdBy)}`}>
            <strong>{list.createdBy}</strong>
          </Link>
        </p>
        <button onClick={handleLikeList} aria-pressed={likedByMe}>
          {likedByMe ? "Unlike" : "Like"} ({list.likes})
        </button>
      </div>

      {!isShared && (
        <div className="list-buttons-up">
          {canEdit && (
            <button
              className={`edit-button ${editing ? "active" : ""}`}
              onClick={openEditor}
            >
              Edit
            </button>
          )}
          {username && !canEdit && !hasPendingRequest && (
            <button className="edit-button" onClick={handleSendCollabRequest}>
              Send Collaboration Request
            </button>
          )}
          {username && !canEdit && hasPendingRequest && (
            <button className="edit-button" disabled>
              Request pending
            </button>
          )}
          <button className="edit-button" onClick={handleShareList}>
            Share List
          </button>
        </div>
      )}

      {editing && (
        <form className="edit-form-vertical" onSubmit={handleSaveEdit}>
          <label>
            List name
            <input
              type="text"
              required
              maxLength={100}
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </label>
          <label>
            Description
            <textarea
              maxLength={1000}
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            ></textarea>
          </label>
          <label>
            Cover Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImageFile(e.target.files[0] || null)}
            />
          </label>
          <ul className="profile-list">
            {validPins.map((pin) => (
              <li
                key={pin._id}
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/places/${pin._id}`)}
                >
                  <strong>{pin.title}</strong> — {pin.description}
                </span>

                <button
                  type="button"
                  className="delete-button"
                  aria-label={`Remove ${pin.title} from list`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePin(pin._id);
                  }}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>

          <div className="edit-button-group">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!editing && <ListMap pins={validPins} />}

      {validPins.length === 0 && (
        <p className="page-status">This list has no places yet.</p>
      )}

      <div className="pin-card-grid">
        {validPins.map((pin) => (
          <div
            key={pin._id}
            className="pin-card"
            onClick={() => navigate(`/places/${pin._id}`)}
          >
            {pin.imageUrl && (
              <img
                src={pin.imageUrl}
                alt={pin.title}
                className="pin-card-image"
              />
            )}
            <div className="pin-card-content">
              <h3>{pin.title}</h3>
              <div className="pin-card-meta">
                <span>{categoryLabel(pin.category)}</span>
                <span>
                  <IoIosThumbsUp style={{ width: "1.25rem", height: "auto" }} />{" "}
                  {pin.likes}{" "}
                  <IoIosThumbsDown
                    style={{ width: "1.25rem", height: "auto" }}
                  />{" "}
                  {pin.dislikes}
                </span>
              </div>
              <p>{pin.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="list-comments-section">
        <h2>Comments</h2>
        {username ? (
          <form onSubmit={handleAddComment} className="list-comment-form">
            <textarea
              value={newListComment}
              onChange={(e) => setNewListComment(e.target.value)}
              placeholder="Write a comment about this list..."
              maxLength={1000}
              required
            ></textarea>
            <button type="submit">Add Comment</button>
          </form>
        ) : (
          <p>
            <Link to="/auth">Log in</Link> to leave a comment.
          </p>
        )}

        <ul className="list-comment-list">
          {listComments.map((comment, index) => (
            <li key={comment._id ?? index} className="list-comment-item">
              <div className="comment-header">
                <strong
                  onClick={() =>
                    navigate(`/profile/${encodeURIComponent(comment.username)}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  {comment.username}
                </strong>{" "}
                <div className="comment-rigth-side">
                  <span>{formatDate(comment.createdAt)}</span>
                  {username === comment.username && (
                    <button
                      className="comment-delete-button"
                      aria-label="Delete comment"
                      onClick={() => setConfirmDeleteId(comment._id)}
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

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Are you sure?</h2>
            <div className="edit-button-group">
              <button onClick={() => handleDeleteComment(confirmDeleteId)}>
                Yes
              </button>
              <button
                className="cancel-button"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
