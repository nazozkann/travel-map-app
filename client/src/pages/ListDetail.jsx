import { useEffect, useState, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ListMap from "../components/ListMap";
import { categories } from "../utils/categories";
import { X } from "lucide-react";

export default function ListDetail() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const location = useLocation();
  const [list, setList] = useState(null);
  const [searchParams] = useSearchParams();
  const addedRef = useRef(false);
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((cat) => cat.key)
  );
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    coverImage: "",
  });
  const [listComments, setListComments] = useState([]);
  const [newListComment, setNewListComment] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [activeButton, setActiveButton] = useState(null);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  const isShared = location.pathname.startsWith("/share");

  useEffect(() => {
    if (!list) return;

    const username = localStorage.getItem("username");
    if (!username) return;

    if (list.collaborators.includes(username)) {
      setIsCollaborator(true);
      setHasSentRequest(false);
      return;
    }
    const reqEntry = list.collabRequests?.find((r) => r.username === username);

    if (!reqEntry) {
      setHasSentRequest(false);
      setIsCollaborator(false);
      return;
    }

    switch (reqEntry.status) {
      case "pending":
        setHasSentRequest(true);
        setIsCollaborator(false);
        break;
      case "accepted":
        setHasSentRequest(false);
        setIsCollaborator(true);
        break;
      case "rejected":
        setHasSentRequest(false);
        setIsCollaborator(false);
        break;
      default:
        break;
    }
  }, [list]);

  useEffect(() => {
    const endpoint = isShared
      ? `http://localhost:8000/api/lists/share/${listId}`
      : `http://localhost:8000/api/lists/id/${listId}`;

    fetch(endpoint)
      .then((r) => r.json())
      .then(setList)
      .catch(console.error);
  }, [listId, isShared]);

  useEffect(() => {
    if (isShared) return;

    const pinId = searchParams.get("pin");
    if (!pinId || addedRef.current) return;

    fetch(`http://localhost:8000/api/lists/${listId}/add-pin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pinId,
        username: localStorage.getItem("username"),
      }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setList(updated);
        addedRef.current = true;
        navigate(`/lists/${listId}`, { replace: true });
      })
      .catch(console.error);
  }, [listId, searchParams, navigate, isShared]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/lists/${listId}/comments`)
      .then((res) => res.json())
      .then((data) => setListComments(data))
      .catch((err) => console.error("List comments fetch error:", err));
  }, [listId]);

  const validPins = Array.isArray(list?.pins) ? list.pins.filter(Boolean) : [];
  const filteredPins = validPins.filter((pin) =>
    selectedCategories.includes(pin.category)
  );

  async function handleRemovePin(pinId) {
    const username = localStorage.getItem("username");
    const res = await fetch(
      `http://localhost:8000/api/lists/${listId}/remove-pin`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId, username }),
      }
    );
    const updated = await res.json();
    setList(updated);
  }

  function handleShareList() {
    const shareUrl = `${window.location.origin}/share/${listId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("✅ Share link copied to clipboard!");
    });
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const username = localStorage.getItem("username" || "anonymous");

    try {
      const res = await fetch(
        `http://localhost:8000/api/lists/${listId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newListComment, username }),
        }
      );

      const addedComment = await res.json();
      if (!addedComment._id) {
        console.error("Comment id is missing!");
        return;
      }

      setListComments((prev) => [addedComment, ...prev]);
      setNewListComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }

  async function handleDeleteComment(commentId) {
    const username = localStorage.getItem("username");

    try {
      const res = await fetch(
        `http://localhost:8000/api/lists/${listId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        setListComments((prev) =>
          prev.filter((comment) => comment._id !== commentId)
        );
        setConfirmDeleteId(null);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  }

  async function handleLikeList() {
    const username = localStorage.getItem("username");
    try {
      const res = await fetch(
        `http://localhost:8000/api/lists/${listId}/like`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );
      const updated = await res.json();
      setList((prev) => ({
        ...prev,
        likes: updated.likes,
        likedBy: updated.likedBy,
      }));
    } catch (err) {
      console.error("Error liking list:", err);
    }
  }

  function handleCoverImageChange(e) {
    setCoverImageFile(e.target.files[0]);
  }

  async function handleSendCollabRequest() {
    const username = localStorage.getItem("username");
    const endpoint = `http://localhost:8000/api/lists/${listId}/request-collab`;
    console.log("👇 Sending collab request to:", endpoint);

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      console.log("⚙️ Response status:", res.status);
      const data = await res.json();
      console.log("👀 Response body:", data);
      if (res.ok) {
        alert("Request sent!");
        setHasSentRequest(true);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error sending request:", err);
      alert("Something went wrong");
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    const username = localStorage.getItem("username");

    let updatedForm = { ...editForm };

    if (coverImageFile) {
      const formData = new FormData();
      formData.append("cover", coverImageFile);

      const uploadRes = await fetch(
        "http://localhost:8000/api/lists/upload-cover",
        {
          method: "POST",
          body: formData,
        }
      );
      const uploadData = await uploadRes.json();
      updatedForm.coverImage = uploadData.filePath;
    }

    const res = await fetch(`http://localhost:8000/api/lists/${listId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updatedForm,
        username,
      }),
    });

    const updated = await res.json();
    setList(updated);
    setEditing(false);
  }

  if (!list) return <p>Loading list...</p>;

  return (
    <div className="pin-detail-container">
      <div className="title-edit">
        <h1 className="pin-title">{list.name}</h1>
      </div>

      {list.coverImage && (
        <div className="cover-image-container">
          <img src={`http://localhost:8000${list.coverImage}`} alt="Cover" />
        </div>
      )}

      <p>{list.description}</p>

      <div className="list-detail-bottom">
        <p style={{ marginBottom: "1rem" }}>
          Created by <strong>{list.createdBy}</strong>
        </p>
        <button onClick={handleLikeList}>
          {list.likedBy.includes(localStorage.getItem("username"))
            ? "Unlike"
            : "Like"}{" "}
          ({list.likes})
        </button>
      </div>

      <div className="list-buttons-up">
        {!isShared &&
          (localStorage.getItem("username") === list.createdBy ||
            isCollaborator) && (
            <button
              className={`edit-button ${
                activeButton === "edit" ? "active" : ""
              }`}
              onClick={() => {
                setEditing(true);
                setActiveButton("edit");
              }}
            >
              Edit
            </button>
          )}
        {!isShared &&
          localStorage.getItem("username") !== list.createdBy &&
          !isCollaborator &&
          !hasSentRequest && (
            <button className="edit-button" onClick={handleSendCollabRequest}>
              Send Collaboration Request
            </button>
          )}
        {!isShared && (
          <button
            className={`edit-button ${
              activeButton === "share" ? "active" : ""
            }`}
            onClick={() => {
              handleShareList();
              setActiveButton("share");
            }}
          >
            Share List
          </button>
        )}
      </div>

      {editing && (
        <form className="edit-form-vertical" onSubmit={handleSaveEdit}>
          <label>
            List name
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </label>
          <label>
            Description
            <textarea
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
              onChange={handleCoverImageChange}
            />
          </label>
          <ul className="profile-list">
            {filteredPins.map((pin) => (
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
            <button type="submit">Save</button>
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

      {!editing && <ListMap pins={filteredPins} />}

      <div className="list-comments-section">
        <h2>Comments</h2>
        <form onSubmit={handleAddComment} className="list-comment-form">
          <textarea
            value={newListComment}
            onChange={(e) => setNewListComment(e.target.value)}
            placeholder="Write a comment about this list..."
            required
          ></textarea>
          <button type="submit">Add Comment</button>
        </form>

        <ul className="list-comment-list">
          {listComments.map((comment, index) => {
            const isOwner =
              localStorage.getItem("username") === comment.username;
            const date = new Date(comment.createdAt);
            const formattedDate = date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <li key={comment._id ?? index} className="list-comment-item">
                <div className="comment-header">
                  <strong>{comment.username}</strong>{" "}
                  <div className="comment-rigth-side">
                    <span>{formattedDate}</span>
                    {isOwner && (
                      <button
                        className="comment-delete-button"
                        onClick={() => setConfirmDeleteId(comment._id)}
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
