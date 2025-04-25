import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import ListMap from "../components/ListMap";
import { useRef } from "react";

export default function ListDetail() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const [list, setList] = useState(null);
  const [searchParams] = useSearchParams();
  const addedRef = useRef(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/lists/id/${listId}`)
      .then((r) => r.json())
      .then(setList)
      .catch(console.error);
  }, [listId]);

  useEffect(() => {
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
  }, [listId, searchParams, navigate]);

  if (!list) return <p>Loading list...</p>;

  const validPins = Array.isArray(list.pins) ? list.pins.filter(Boolean) : [];

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

  return (
    <div style={{ padding: "2rem" }}>
      <h2>List: {list.name}</h2>
      <p>Created by: {list.createdBy}</p>

      {validPins.length > 0 ? (
        <>
          <ListMap pins={validPins} />

          <ul>
            {validPins.map((pin) => (
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
                {localStorage.getItem("username") === list.createdBy && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // detay sayfasına yönlenmeyi engelle
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
