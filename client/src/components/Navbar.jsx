import { Link, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Compass, LogIn, Map as MapIcon, MapPin, Menu, Moon, Sun, User, X } from "lucide-react";
import "../styles/Navbar.css";
import SearchBar from "./SearchBar";
import useAuth from "../hooks/useAuth";
import { api } from "../utils/api";
import { isDarkTheme, toggleTheme, THEME_EVENT } from "../utils/theme";

export default function Navbar({ setLocation }) {
  const location = useLocation();
  const username = useAuth();
  const [hasNotifications, setHasNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(isDarkTheme);
  const menuRef = useRef();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const sync = () => setDark(document.body.classList.contains("dark"));
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  const links = [
    { to: "/", label: "Map", Icon: MapIcon, end: true },
    { to: "/places", label: "Discover", Icon: Compass },
    username
      ? {
          to: `/profile/${encodeURIComponent(username)}`,
          label: "Profile",
          Icon: User,
          dot: hasNotifications,
        }
      : { to: "/auth", label: "Log in", Icon: LogIn },
  ];

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-btn"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  return (
    <header className={`nav ${isHome ? "nav-home" : ""}`}>
      <Link to="/" className="nav-logo" aria-label="Explora home">
        <span className="logo-mark">
          <MapPin size={18} strokeWidth={2.5} />
        </span>
        <span className="nav-logo-text">Explora</span>
      </Link>

      {isHome && (
        <div className="nav-search">
          <SearchBar onSelectLocation={setLocation} />
        </div>
      )}

      <nav className="nav-links" aria-label="Main">
        {links.map(({ to, label, end, dot }) => (
          <NavLink key={to} to={to} end={end} className="nav-link">
            {label}
            {dot && <span className="notification-dot" aria-label="New notifications" />}
          </NavLink>
        ))}
        {themeButton}
      </nav>

      <div className="nav-mobile" ref={menuRef}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
          {hasNotifications && !menuOpen && <span className="notification-dot" />}
        </button>

        {menuOpen && (
          <div className="nav-menu">
            {links.map(({ to, label, Icon, end, dot }) => (
              <NavLink key={to} to={to} end={end} className="nav-menu-item">
                <Icon size={18} aria-hidden="true" />
                {label}
                {dot && <span className="notification-dot static" />}
              </NavLink>
            ))}
            <button type="button" className="nav-menu-item" onClick={toggleTheme}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {dark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
