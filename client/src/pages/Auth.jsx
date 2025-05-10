import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      <form className="auth-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <p className="auth-toggle-text">
        Don’t have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
}
