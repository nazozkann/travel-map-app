import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/Navbar.css";
import SearchBar from "./SearchBar";
import { CgDarkMode } from "react-icons/cg";

export default function Navbar({ setLocation }) {
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const lightMapStyle = `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;
  const darkMapStyle = `https://api.maptiler.com/maps/0196bac3-e637-7c87-b191-32cc9b5b086a/style.json?key=${
    import.meta.env.VITE_MAPTILER_API_KEY
  }`;
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (window.mapInstance) {
      const newStyle = isDark ? darkMapStyle : lightMapStyle;
      window.mapInstance.setStyle(newStyle);
    }
    if (window.listMapInstance) {
      const newStyle = isDark ? darkMapStyle : lightMapStyle;
      window.listMapInstance.setStyle(newStyle);
    }
    if (window.detailMapInstance) {
      const newStyle = isDark ? darkMapStyle : lightMapStyle;
      window.detailMapInstance.setStyle(newStyle);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.body.classList.add("dark");
    }
  }, []);

  return (
    <nav className="nav-style">
      <Link to="/" className="nav-logo-link">
        Explora
      </Link>
      {location.pathname === "/" && (
        <SearchBar onSelectLocation={setLocation} />
      )}
      <button
        className="hamburger-btn"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        ☰
      </button>

      <div className={`nav-rigth ${menuOpen ? "open" : ""}`} ref={menuRef}>
        <Link to="/places" onClick={() => setMenuOpen(false)}>
          Selected
        </Link>

        {isLoggedIn ? (
          <div className="nav-profile-wrapper">
            <Link
              to={`/profile/${username}`}
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            {hasNotifications && <span className="notification-dot" />}
          </div>
        ) : (
          <Link to="/auth" onClick={() => setMenuOpen(false)}>
            Login
          </Link>
        )}

        <button
          onClick={() => {
            toggleDarkMode();
            setMenuOpen(false);
          }}
          className="theme-toggle-btn"
        >
          <CgDarkMode />
        </button>
      </div>
    </nav>
  );
}
