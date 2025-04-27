import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Navbar.css";
import SearchBar from "./SearchBar";

export default function Navbar({ setLocation }) {
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (token) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    } else {
      setIsLoggedIn(false);
    }
  }, [location.pathname]);

  return (
    <nav className="nav-style">
      <Link to="/" className="nav-logo-link">
        Explora
      </Link>
      <SearchBar onSelectLocation={setLocation} />
      <div className="nav-rigth">
        <Link to="/places">Selected</Link>
        {isLoggedIn ? (
          <Link to="/profile">Profile</Link>
        ) : (
          <Link to="/auth">Login</Link>
        )}
      </div>
    </nav>
  );
}
