import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import { IoIosThumbsDown, IoIosThumbsUp } from "react-icons/io";
import "../styles/Main.css";
import useDragScroll from "../hooks/useDragScroll";
import useAuth from "../hooks/useAuth";
import { api } from "../utils/api";
import { clearSession } from "../utils/auth";

function PinCards({ pins, listRef, onOpen, emptyText }) {
  if (pins.length === 0) return <p>{emptyText}</p>;
  return (
    <ul className="profile-card-list" ref={listRef}>
      {pins.map((pin) => (
        <li className="profile-card" onClick={() => onOpen(pin._id)} key={pin._id}>
          {pin.imageUrl && (
            <div className="profile-card-image">
              <img src={pin.imageUrl} alt={pin.title} />
            </div>
          )}
          <h3>{pin.title}</h3>
          <div className="profile-card-likes">
            <span>
              <IoIosThumbsUp style={{ height: "1.25rem", width: "auto" }} />{" "}
              {pin.likes}
            </span>
            <span>
              <IoIosThumbsDown style={{ height: "1.25rem", width: "auto" }} />{" "}
              {pin.dislikes}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const currentUser = useAuth();
  const isOwnProfile = Boolean(currentUser) && currentUser === username;

  const [pins, setPins] = useState([]);
  const [likedPins, setLikedPins] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [activeTab, setActiveTab] = useState("added");
  const [collabRequests, setCollabRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const addedRef = useRef();
  const likedRef = useRef();
  const listRef = useRef();

  useDragScroll(addedRef, activeTab === "added" && pins.length > 0);
  useDragScroll(likedRef, activeTab === "liked" && likedPins.length > 0);
  useDragScroll(listRef, activeTab === "lists" && userLists.length > 0);

  useEffect(() => {
    const user = encodeURIComponent(username);
    const logError = (what) => (err) =>
      console.error(`${what} couldn't be loaded:`, err);

    api(`/api/users/${user}/pins`).then(setPins).catch(logError("Pins"));
    api(`/api/users/${user}/liked`).then(setLikedPins).catch(logError("Likes"));
    api(`/api/lists/${user}`).then(setUserLists).catch(logError("Lists"));
  }, [username]);

  // Requests and notifications are private: only load them on your own profile.
  useEffect(() => {
    if (!isOwnProfile) {
      setCollabRequests([]);
      setNotifications([]);
      return;
    }
    api("/api/lists/me/collab-requests", { auth: true })
      .then(setCollabRequests)
      .catch((err) => console.error("İstekler alınamadı:", err));
    api("/api/lists/me/notifications", { auth: true })
      .then(setNotifications)
      .catch((err) => console.error("Bildirimler alınamadı:", err));
  }, [isOwnProfile]);

  function handleLogout() {
    clearSession();
    navigate("/auth");
  }

  function goToDetail(pinId) {
    navigate(`/places/${pinId}`);
  }

  async function handleCollabDecision(listId, requesterUsername, decision) {
    try {
      await api(`/api/lists/${listId}/collab-response`, {
        method: "PUT",
        auth: true,
        body: { requester: requesterUsername, action: decision },
      });
      setCollabRequests((prev) =>
        prev.filter(
          (r) => r.username !== requesterUsername || r.listId !== listId
        )
      );
      alert(`Request ${decision}`);
    } catch (err) {
      console.error("Collab response error:", err);
      alert(err.message);
    }
  }

  async function handleMarkAsRead(listId) {
    try {
      await api(`/api/lists/me/notifications/${listId}/read`, {
        method: "POST",
        auth: true,
      });
      setNotifications((prev) => prev.filter((n) => n.listId !== listId));
    } catch (err) {
      console.error("Error marking as read:", err);
      alert(err.message);
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-pic">
        <CircleUserRound style={{ width: "7rem", height: "auto" }} />
      </div>

      <div className="profile-info">
        <div>
          <p className="welcome-text">{username}</p>
        </div>
        {isOwnProfile && (
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
      <hr />

      <div className="profile-tabs" role="tablist">
        {[
          ["added", "Adds"],
          ["liked", "Likes"],
          ["lists", "Lists"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={activeTab === key ? "tab active" : "tab"}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
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
                <li
                  key={`${req.listId}-${req.username}`}
                  className="profile-list-item"
                >
                  <p>
                    <strong>{req.username}</strong> wants to contribute to{" "}
                    <strong>{req.listName}</strong>
                  </p>
                  <div className="edit-button-group">
                    <button
                      onClick={() =>
                        handleCollabDecision(req.listId, req.username, "accepted")
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() =>
                        handleCollabDecision(req.listId, req.username, "rejected")
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
            <PinCards
              pins={pins}
              listRef={addedRef}
              onOpen={goToDetail}
              emptyText="No places added yet."
            />
          </section>
        )}

        {activeTab === "liked" && (
          <section className="profile-section">
            <h2>Liked Places</h2>
            <PinCards
              pins={likedPins}
              listRef={likedRef}
              onOpen={goToDetail}
              emptyText="No liked places yet."
            />
          </section>
        )}

        {activeTab === "lists" && (
          <section className="profile-section">
            <h2>{isOwnProfile ? "Your Lists" : `${username}'s Lists`}</h2>
            {userLists.length === 0 ? (
              <p>No lists yet.</p>
            ) : (
              <ul className="profile-list" ref={listRef}>
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
                    {list.coverImage && (
                      <div className="profile-list-right">
                        <img src={list.coverImage} alt={list.name} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
