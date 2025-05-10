import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      alert("Account created. You can now log in.");
      navigate("/auth");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
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
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <p className="auth-toggle-text">
        Already have an account? <Link to="/auth">Login here</Link>
      </p>
    </div>
  );
}
