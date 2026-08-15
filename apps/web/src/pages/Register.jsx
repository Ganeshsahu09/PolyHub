import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "BUYER", label: "Buyer — I want to order 3D prints" },
  { value: "DESIGNER", label: "Designer — I want to sell my models" },
  { value: "PRINTER_OWNER", label: "Printer Owner — I want to fulfill print jobs" },
];

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [roles, setRoles] = useState(["BUYER"]);

  function toggleRole(value) {
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (roles.length === 0) return;
    try {
      const user = await register(form.email, form.password, form.name, roles);
      if (user.roles.includes("DESIGNER")) navigate("/designer");
      else if (user.roles.includes("PRINTER_OWNER")) navigate("/printer");
      else navigate("/buyer");
    } catch {
      // error already captured in context
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-zinc-100">Create your account</h1>
        <p className="mb-6 text-sm text-zinc-500">Join PolyHub.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              I want to join as (select at least one)
            </label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(opt.value)}
                    onChange={() => toggleRole(opt.value)}
                    className="accent-teal-400"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || roles.length === 0}
            className="mt-2 rounded-lg bg-teal-400/10 px-4 py-2.5 text-sm font-medium text-teal-300 ring-1 ring-inset ring-teal-400/30 transition-colors hover:bg-teal-400/20 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}