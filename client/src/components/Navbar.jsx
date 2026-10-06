import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/Navbar.css";
import SearchBar from "./SearchBar";
import { CgDarkMode } from "react-icons/cg";
import useAuth from "../hooks/useAuth";
import { api } from "../utils/api";
import { toggleTheme } from "../utils/theme";

export default function Navbar({ setLocation }) {
  const location = useLocation();
  const username = useAuth();
  const [hasNotifications, setHasNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef();
  const hamburgerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !hamburgerRef.current?.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!username) {
      setHasNotifications(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      api("/api/lists/me/notifications", { auth: true }),
      api("/api/lists/me/collab-requests", { auth: true }),
    ])
      .then(([notifications, requests]) => {
        if (!cancelled) {
          setHasNotifications(notifications.length > 0 || requests.length > 0);
        }
      })
      .catch((err) => console.error("Notification fetch failed:", err));
    return () => {
      cancelled = true;
    };
  }, [username, location.pathname]);

  return (
    <nav className="nav-style">
      <Link to="/" className="nav-logo-link">
        Explora
      </Link>
      {location.pathname === "/" && (
        <SearchBar onSelectLocation={setLocation} />
      )}
      <button
        ref={hamburgerRef}
        className="hamburger-btn"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        ☰
      </button>

      <div className={`nav-rigth ${menuOpen ? "open" : ""}`} ref={menuRef}>
        <Link to="/places" onClick={() => setMenuOpen(false)}>
          Selected
        </Link>

        {username ? (
          <div className="nav-profile-wrapper">
            <Link
              to={`/profile/${encodeURIComponent(username)}`}
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            {hasNotifications && (
              <span className="notification-dot" aria-label="New notifications" />
            )}
          </div>
        ) : (
          <Link to="/auth" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        )}

        <button
          onClick={() => {
            toggleTheme();
            setMenuOpen(false);
          }}
          className="theme-toggle-btn"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          <CgDarkMode />
        </button>
      </div>
    </nav>
  );
}
