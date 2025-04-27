import { useEffect, useState, useRef } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import ListMap from "../components/ListMap";
import { categories } from "../utils/categories";

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
  });

  const isShared = location.pathname.startsWith("/share");

  useEffect(() => {
    if (list) {
      setEditForm({
        name: list.name,
        description: list.description || "",
      });
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
    if (isShared) return; // paylaşımlı sayfada ekleme olmaz ❌

    const pinId = searchParams.get("pin");
    if (!pinId || addedRef.current) return;

    fetch(`http://localhost:8000/api/lists/${listId}/add-pin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setList(updated);
        addedRef.current = true;
        navigate(`/lists/${listId}`, { replace: true });
      })
      .catch(console.error);
  }, [listId, searchParams, navigate, isShared]);

  if (!list) return <p>Loading list...</p>;

  const validPins = Array.isArray(list.pins) ? list.pins.filter(Boolean) : [];
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
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("✅ Share link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

  return (
    <div style={{ padding: "2rem" }}>
      {localStorage.getItem("username") === list.createdBy && (
        <div style={{ marginBottom: "1rem" }}>
          {!editing ? (
            <button onClick={() => setEditing(true)}>Edit List</button>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const username = localStorage.getItem("username");
                const res = await fetch(
                  `http://localhost:8000/api/lists/${listId}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...editForm, username }),
                  }
                );
                const updated = await res.json();
                setList(updated);
                setEditing(false);
              }}
            >
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="List name"
                required
              />
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Description"
              ></textarea>
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </form>
          )}
        </div>
      )}
      <h2>
        {isShared ? "Shared List" : "Your List"}: {list.name}
      </h2>
      <p>Created by: {list.createdBy}</p>
      {!isShared && (
        <button
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "lightblue",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={handleShareList}
        >
          🔗 Share this list
        </button>
      )}

      {validPins.length > 0 ? (
        <>
          <ListMap pins={filteredPins} />

          <ul>
            {filteredPins.map((pin) => (
              <li
                key={pin._id}
                style={{
                  cursor: "pointer",
                  color: "blue",
                  textDecoration: "underline",
                  margin: "0.5rem 0",
                }}
                onClick={() => navigate(`/places/${pin._id}`)}
              >
                <strong>{pin.title}</strong> — {pin.description}
                {!isShared &&
                  localStorage.getItem("username") === list.createdBy &&
                  editing && ( // edit mod açıkken göster
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePin(pin._id);
                      }}
                      style={{ marginLeft: "1rem", color: "red" }}
                    >
                      ❌
                    </button>
                  )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No places in this list yet.</p>
      )}
    </div>
  );
}
