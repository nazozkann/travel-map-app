import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
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
    <main className="auth-page">
      <div className="auth-card">
        <span className="logo-mark logo-mark-lg">
          <MapPin size={26} strokeWidth={2.5} />
        </span>
        <h1>Welcome back</h1>
        <p className="muted">Log in to save, rate and share places.</p>

        <form className="form" onSubmit={handleLogin}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account? <Link to="/signup" className="link">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
