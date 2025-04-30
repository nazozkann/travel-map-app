import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
import "../styles/Main.css";

export default function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);
  const [pins, setPins] = useState([]);
  const [likedPins, setLikedPins] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [activeTab, setActiveTab] = useState("added");
  const [collabRequests, setCollabRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      navigate("/auth");
    } else {
      setUsername(storedUsername);
    }
  }, [navigate]);
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

    fetch(`http://localhost:8000/api/lists/collab-requests/${username}`)
      .then((res) => res.json())
      .then(setCollabRequests)
      .catch((err) => console.error("İstekler alınamadı:", err));

    fetch(`http://localhost:8000/api/lists/notifications/${username}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Bildirimler alınamadı:", err));
  }, [username]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/auth");
  }

  function goToDetail(pinId) {
    navigate(`/places/${pinId}`);
  }

  async function handleCollabDecision(listId, requesterUsername, decision) {
    try {
      const res = await fetch(
        `http://localhost:8000/api/lists/${listId}/collab-response`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requester: requesterUsername,
            action: decision,
            username: localStorage.getItem("username"),
            owner: username,
          }),
        }
      );

      const result = await res.json();
      if (res.ok) {
        setCollabRequests((prev) =>
          prev.filter(
            (r) => r.username !== requesterUsername || r.listId !== listId
          )
        );
        alert(`Request ${decision}`);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Collab response error:", err);
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-pic">
        <CircleUserRound style={{ width: "7rem", height: "auto" }} />
      </div>

      <div className="profile-info">
        {username ? (
          <div>
            <p className="welcome-text">{username}</p>
            <p>Bio</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <hr />

      <div className="profile-tabs">
        <button
          className={activeTab === "added" ? "tab active" : "tab"}
          onClick={() => setActiveTab("added")}
        >
          Adds
        </button>
        <button
          className={activeTab === "liked" ? "tab active" : "tab"}
          onClick={() => setActiveTab("liked")}
        >
          Likes
        </button>
        <button
          className={activeTab === "lists" ? "tab active" : "tab"}
          onClick={() => setActiveTab("lists")}
        >
          Lists
        </button>
      </div>

      <div className="profile-content">
        {notifications.length > 0 && (
          <div className="notification-section">
            <h2>Notifications</h2>
            <ul>
              {notifications.map((notif) => (
                <li
                  key={`${notif.listId}-${notif.status}`}
                  className={`notif-item ${notif.status}`}
                >
                  Your request to collaborate on
                  <strong> {notif.listName} </strong>
                  was <strong>{notif.status}</strong>.
                </li>
              ))}
            </ul>
          </div>
        )}
        {collabRequests.length > 0 && (
          <section className="profile-section">
            <h2>Collab Requests</h2>
            <ul className="profile-list">
              {collabRequests.map((req) => (
                <li key={req._id} className="profile-list-item">
                  <p>
                    <strong>{req.username}</strong> wants to contribute to{" "}
                    <strong>{req.listName}</strong>
                  </p>
                  <div className="edit-button-group">
                    <button
                      onClick={() =>
                        handleCollabDecision(
                          req.listId,
                          req.username,
                          "accepted"
                        )
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() =>
                        handleCollabDecision(
                          req.listId,
                          req.username,
                          "rejected"
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {activeTab === "added" && (
          <section className="profile-section">
            <h2>Places added by {username}</h2>
            <ul className="profile-card-list">
              {pins.map((pin) => (
                <li
                  className="profile-card"
                  onClick={() => goToDetail(pin._id)}
                  key={pin._id}
                >
                  {pin.imageUrl && (
                    <div className="profile-card-image">
                      <img src={pin.imageUrl} alt={pin.title} />
                    </div>
                  )}
                  <h3>{pin.title}</h3>
                  <div className="profile-card-likes">
                    <span>
                      <IoIosThumbsUp
                        style={{ height: "1.25rem", width: "auto" }}
                      />{" "}
                      {pin.likes}
                    </span>
                    <span>
                      <IoIosThumbsDown
                        style={{ height: "1.25rem", width: "auto" }}
                      />{" "}
                      {pin.dislikes}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === "liked" && (
          <section className="profile-section">
            <h2>Liked Places</h2>
            <ul className="profile-card-list">
              {likedPins.map((pin) => (
                <li
                  className="profile-card"
                  onClick={() => goToDetail(pin._id)}
                  key={pin._id}
                >
                  {pin.imageUrl && (
                    <div className="profile-card-image">
                      <img src={pin.imageUrl} alt={pin.title} />
                    </div>
                  )}
                  <h3>{pin.title}</h3>
                  <div className="profile-card-likes">
                    <span>
                      <IoIosThumbsUp
                        style={{ height: "1.25rem", width: "auto" }}
                      />{" "}
                      {pin.likes}
                    </span>
                    <span>
                      <IoIosThumbsDown
                        style={{ height: "1.25rem", width: "auto" }}
                      />{" "}
                      {pin.dislikes}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === "lists" && (
          <section className="profile-section">
            <h2>Your Lists</h2>
            <ul className="profile-list">
              {userLists.map((list) => (
                <li
                  className="profile-list-item-list"
                  key={list._id}
                  onClick={() => navigate(`/lists/${list._id}`)}
                >
                  <div className="profile-list-left">
                    {list.name} ({list.pins.length} place
                    {list.pins.length !== 1 ? "s" : ""})
                    <p>{list.description}</p>
                  </div>
                  <div className="profile-list-right">
                    <img
                      src={`http://localhost:8000${list.coverImage}`}
                      alt={list.name}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
