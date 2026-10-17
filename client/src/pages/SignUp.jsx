import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { api } from "../utils/api";

export default function SignUp() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api("/api/auth/register", { method: "POST", body: form });
      alert("Account created. You can now log in.");
      navigate("/auth");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="logo-mark logo-mark-lg">
          <MapPin size={26} strokeWidth={2.5} />
        </span>
        <h1>Create an account</h1>
        <p className="muted">Start pinning the places you love.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Username</span>
            <input
              className="input"
              type="text"
              name="username"
              placeholder="3–20 characters"
              autoComplete="username"
              autoCapitalize="none"
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_.\-]+"
              title="3-20 characters: letters, numbers, _ . -"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/auth" className="link">Log in</Link>
        </p>
      </div>
    </main>
  );
}
