import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          autoComplete="username"
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_.\-]+"
          title="3-20 characters: letters, numbers, _ . -"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min. 6 characters)"
          autoComplete="new-password"
          minLength={6}
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <p className="auth-toggle-text">
        Already have an account? <Link to="/auth">Login here</Link>
      </p>
    </div>
  );
}
