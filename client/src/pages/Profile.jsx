import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  const location = useLocation();

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

    fetch(import.meta.env.VITE_API_URL + `/api/users/${username}/pins`)
      .then((res) => res.json())
      .then(setPins);

    fetch(import.meta.env.VITE_API_URL + `/api/users/${username}/liked`)
      .then((res) => res.json())
      .then(setLikedPins);

    fetch(import.meta.env.VITE_API_URL + `/api/lists/${username}`)
      .then((res) => res.json())
      .then(setUserLists)
      .catch((err) => console.error("Liste çekilemedi:", err));

    fetch(
      import.meta.env.VITE_API_URL + `/api/lists/collab-requests/${username}`
    )
      .then((res) => res.json())
      .then(setCollabRequests)
      .catch((err) => console.error("İstekler alınamadı:", err));
  }, [username]);

  useEffect(() => {
    if (!username) return;

    fetch(import.meta.env.VITE_API_URL + `/api/lists/notifications/${username}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Bildirimler alınamadı:", err));
  }, [username, location.pathname]);

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
        import.meta.env.VITE_API_URL + `/api/lists/${listId}/collab-response`,
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

  async function handleMarkAsRead(listId) {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/lists/notifications/mark-read",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: localStorage.getItem("username"),
            listId,
          }),
        }
      );
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.listId !== listId));
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error("Error marking as read:", err);
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
          <div className="profile-section notification-section">
            <h2>Notifications</h2>
            <ul className="profile-list">
              {notifications.map((notif) => (
                <li
                  key={`${notif.listId}-${notif.status}`}
                  className={`profile-list-item notif-item ${notif.status}`}
                >
                  <span>
                    Your request to collaborate on
                    <strong> {notif.listName} </strong>
                    was <strong>{notif.status}</strong>.
                  </span>
                  <button
                    className="ok-button"
                    onClick={() => handleMarkAsRead(notif.listId)}
                  >
                    OK
                  </button>
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
                      src={import.meta.env.VITE_API_URL + `${list.coverImage}`}
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
