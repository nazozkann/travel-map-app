import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Bell, Heart, List, LogOut, MapPin, UserPlus } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { api } from "../utils/api";
import { clearSession } from "../utils/auth";
import { CardGrid, EmptyState, ListCard, PlaceCard } from "../components/Cards";

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
      .catch((err) => console.error("Collab requests couldn't be loaded:", err));
    api("/api/lists/me/notifications", { auth: true })
      .then(setNotifications)
      .catch((err) => console.error("Notifications couldn't be loaded:", err));
  }, [isOwnProfile]);

  function handleLogout() {
    clearSession();
    navigate("/auth");
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

  const tabs = [
    { key: "added", label: "Places", count: pins.length },
    { key: "liked", label: "Liked", count: likedPins.length },
    { key: "lists", label: "Lists", count: userLists.length },
  ];

  return (
    <main className="page">
      <header className="profile-header">
        <span className="avatar avatar-lg" aria-hidden="true">
          {username?.[0]?.toUpperCase()}
        </span>
        <div className="profile-heading">
          <h1>{username}</h1>
          <p className="muted">
            {pins.length} place{pins.length === 1 ? "" : "s"} · {userLists.length} list
            {userLists.length === 1 ? "" : "s"}
          </p>
        </div>
        {isOwnProfile && (
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        )}
      </header>

      {notifications.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <Bell size={18} aria-hidden="true" /> Notifications
          </h2>
          <ul className="notice-list">
            {notifications.map((notif) => (
              <li key={`${notif.listId}-${notif.status}`} className="notice">
                <p>
                  Your request to collaborate on{" "}
                  <Link to={`/lists/${notif.listId}`} className="link">
                    {notif.listName}
                  </Link>{" "}
                  was <strong>{notif.status}</strong>.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleMarkAsRead(notif.listId)}
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {collabRequests.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <UserPlus size={18} aria-hidden="true" /> Collaboration requests
          </h2>
          <ul className="notice-list">
            {collabRequests.map((req) => (
              <li key={`${req.listId}-${req.username}`} className="notice">
                <p>
                  <strong>{req.username}</strong> wants to contribute to{" "}
                  <Link to={`/lists/${req.listId}`} className="link">
                    {req.listName}
                  </Link>
                </p>
                <div className="btn-row">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      handleCollabDecision(req.listId, req.username, "accepted")
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      handleCollabDecision(req.listId, req.username, "rejected")
                    }
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="segmented segmented-full" role="tablist">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key)}
          >
            {label} <span className="count">{count}</span>
          </button>
        ))}
      </div>

      <section className="tab-panel">
        {activeTab === "added" &&
          (pins.length === 0 ? (
            <EmptyState icon={MapPin} title="No places added yet" />
          ) : (
            <CardGrid>
              {pins.map((pin) => (
                <PlaceCard key={pin._id} pin={pin} />
              ))}
            </CardGrid>
          ))}

        {activeTab === "liked" &&
          (likedPins.length === 0 ? (
            <EmptyState icon={Heart} title="No liked places yet" />
          ) : (
            <CardGrid>
              {likedPins.map((pin) => (
                <PlaceCard key={pin._id} pin={pin} />
              ))}
            </CardGrid>
          ))}

        {activeTab === "lists" &&
          (userLists.length === 0 ? (
            <EmptyState icon={List} title="No lists yet">
              {isOwnProfile && "Open a place and add it to a new list."}
            </EmptyState>
          ) : (
            <CardGrid>
              {userLists.map((list) => (
                <ListCard key={list._id} list={list} />
              ))}
            </CardGrid>
          ))}
      </section>
    </main>
  );
}
