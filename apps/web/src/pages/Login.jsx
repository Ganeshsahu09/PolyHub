import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const user = await login(email, password);
      // Send them to whichever role view they hold first — role
      // switching between multiple roles happens inside the app itself.
      if (user.roles.includes("DESIGNER")) navigate("/designer");
      else if (user.roles.includes("PRINTER_OWNER")) navigate("/printer");
      else navigate("/buyer");
    } catch {
      // error is already captured in context state and shown below
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-zinc-100">Log in to PolyHub</h1>
        <p className="mb-6 text-sm text-zinc-500">Welcome back.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/50"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-teal-400/10 px-4 py-2.5 text-sm font-medium text-teal-300 ring-1 ring-inset ring-teal-400/30 transition-colors hover:bg-teal-400/20 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-teal-300 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}