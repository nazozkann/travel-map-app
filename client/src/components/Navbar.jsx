import { Link, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Navbar.css";
import SearchBar from "./SearchBar";

export default function Navbar({ setLocation }) {
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (token) {
      setIsLoggedIn(true);
      setUsername(storedUsername);

      fetch(
        import.meta.env.VITE_API_URL +
          `/api/lists/notifications/${storedUsername}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            setHasNotifications(true);
          } else {
            setHasNotifications(false);
          }
        })
        .catch((err) => {
          console.error("Notification fetch failed:", err);
        });

      fetch(
        import.meta.env.VITE_API_URL +
          `/api/lists/collab-requests/${storedUsername}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            setHasNotifications(true);
          }
        })
        .catch(console.error);
    } else {
      setIsLoggedIn(false);
    }
  }, [location.pathname]);

  return (
    <nav className="nav-style">
      <Link to="/" className="nav-logo-link">
        Explora
      </Link>
      {location.pathname === "/" && (
        <SearchBar onSelectLocation={setLocation} />
      )}
      <div className="nav-rigth">
        <Link to="/places">Selected</Link>
        {isLoggedIn ? (
          <div className="nav-profile-wrapper">
            <Link to={`/profile/${username}`}>Profile</Link>
            {hasNotifications && <span className="notification-dot" />}
          </div>
        ) : (
          <Link to="/auth">Login</Link>
        )}
      </div>
    </nav>
  );
}
