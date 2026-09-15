import { useState } from "react";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/login`;

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password."
        );
      }

      // Persist the JWT so other pages (e.g. Student Registration) can
      // send it as a Bearer token. Without this, any page that reads
      // localStorage for a token will always find nothing and fail.
      if (data.token) {
        localStorage.setItem("token", data.token);
      } else {
        console.warn(
          "Login response did not include a 'token' field — check your backend's login response shape."
        );
      }

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo">SM</div>

          <h1>
            Student<span>Hub</span>
          </h1>

          <p>Management System</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to access your dashboard.</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
