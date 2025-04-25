import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);
  const [pins, setPins] = useState([]);
  const [likedPins, setLikedPins] = useState([]);
  const [userLists, setUserLists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      navigate("/auth");
    } else {
      setUsername(storedUsername);
    }
  }, []);
  useEffect(() => {
    if (!username) return;

    fetch(`http://localhost:8000/api/users/${username}/pins`)
      .then((res) => res.json())
      .then(setPins);

    fetch(`http://localhost:8000/api/users/${username}/liked`)
      .then((res) => res.json())
      .then(setLikedPins);

    fetch(`http://localhost:8000/api/lists/${username}`)
      .then((res) => res.json())
      .then(setUserLists)
      .catch((err) => console.error("Liste çekilemedi:", err));
  }, [username]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/auth");
  }

  function goToDetail(pinId) {
    navigate(`/places/${pinId}`);
  }

  return (
    <div>
      <h1>Profile</h1>
      {username ? <p>Welcome, {username}!</p> : <p>Loading...</p>}
      <div style={{ padding: "2rem" }}>
        <h2>📍 Places added by {username}</h2>
        <ul>
          {pins.map((pin) => (
            <li onClick={() => goToDetail(pin._id)} key={pin._id}>
              {pin.title}
            </li>
          ))}
        </ul>

        <h2>❤️ Liked Places</h2>
        <ul>
          {likedPins.map((pin) => (
            <li onClick={() => goToDetail(pin._id)} key={pin._id}>
              {pin.title}
            </li>
          ))}
        </ul>
      </div>
      <h2>🗂️ Your Lists</h2>
      <ul>
        {userLists.map((list) => (
          <li
            key={list._id}
            style={{
              cursor: "pointer",
              color: "blue",
              textDecoration: "underline",
            }}
            onClick={() => navigate(`/lists/${list._id}`)}
          >
            {list.name} ({list.pins.length} place
            {list.pins.length !== 1 ? "s" : ""})
          </li>
        ))}
      </ul>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
