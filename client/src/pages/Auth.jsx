import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";
import { setSession } from "../utils/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setSession(data.token, data.user.username);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      <form className="auth-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <p className="auth-toggle-text">
        Don’t have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
}
