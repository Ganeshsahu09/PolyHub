import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight,
  Hexagon,
  Sparkles,
  ShoppingBag,
  Palette,
  Printer,
  Check,
  ShieldCheck,
} from "lucide-react";
import Interactive3DBackground from "../components/Interactive3DBackground";

/* ── Interactive mouse-tracking glow ── */
function useMouseGlow(containerRef) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 30 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [containerRef, mouseX, mouseY]);

  return { smoothX, smoothY };
}

const ROLE_OPTIONS = [
  {
    value: "BUYER",
    title: "Buyer",
    desc: "Order custom 3D prints & explore",
    icon: ShoppingBag,
  },
  {
    value: "DESIGNER",
    title: "Designer",
    desc: "Sell 3D models & monetize designs",
    icon: Palette,
  },
  {
    value: "PRINTER_OWNER",
    title: "Printer",
    desc: "Fulfill print jobs with local fleet",
    icon: Printer,
  },
];

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [roles, setRoles] = useState(["BUYER"]);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(null);
  const [capsLockActive, setCapsLockActive] = useState(false);

  const prefersReducedMotion = useReducedMotion();
  const { smoothX, smoothY } = useMouseGlow(containerRef);

  function handleKeyDown(e) {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  }

  function toggleRole(value) {
    setRoles((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((r) => r !== value)
          : prev // at least one role stays selected
        : [...prev, value]
    );
  }

  // Password strength calculation
  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p) && p.length >= 10) score += 1;
    return score; // 0, 1, 2, or 3
  };

  const strength = getPasswordStrength();
  const strengthLabels = ["Weak", "Medium", "Strong"];
  const strengthColors = ["bg-red-500", "bg-amber-400", "bg-teal-400"];

  async function handleSubmit(e) {
    e.preventDefault();
    if (roles.length === 0) return;
    try {
      const user = await register(form.email, form.password, form.name, roles);
      if (user.roles.includes("DESIGNER")) navigate("/designer");
      else if (user.roles.includes("PRINTER_OWNER")) navigate("/printer");
      else navigate("/buyer");
    } catch {
      // error is already captured in context state
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyDown}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10"
    >
      {/* ── Real 3D Canvas Background ── */}
      <Interactive3DBackground />

      {/* ── Background Grid & Scanner ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #2DD4BF 1px, transparent 1px), linear-gradient(to bottom, #2DD4BF 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {!prefersReducedMotion && (
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent"
            animate={{ top: ["-5%", "105%"] }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* ── Interactive Cursor Glow ── */}
      {!prefersReducedMotion && (
        <motion.div
          className="pointer-events-none absolute h-[550px] w-[550px] rounded-full"
          style={{
            x: smoothX,
            y: smoothY,
            translateX: "-50%",
            translateY: "-50%",
            background:
              "radial-gradient(circle, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 40%, transparent 70%)",
          }}
        />
      )}

      {/* ── Ambient Glows ── */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-[550px] w-[550px] rounded-full bg-teal-500/[0.04] blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[550px] w-[550px] rounded-full bg-teal-400/[0.03] blur-[140px]" />

      {/* ── Main Glass Card ── */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        {/* Soft edge ambient halo */}
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-teal-400/20 via-teal-400/5 to-transparent opacity-80 blur-[2px]" />

        <div className="relative rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-7 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-9">
          {/* Header & Logo */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/30">
                <Hexagon className="h-5 w-5 text-teal-400" strokeWidth={1.8} />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-zinc-100">
                  PolyHub
                </span>
                <span className="block text-[10px] font-medium text-teal-400/80 uppercase tracking-wider">
                  3D Manufacturing
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-[11px] font-medium text-teal-300">
              <Sparkles className="h-3 w-3" />
              <span>Join Free</span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              Create an account
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Join the distributed manufacturing and 3D design network
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Full name
              </label>
              <div
                className={`relative rounded-xl transition-all duration-200 ${
                  isFocused === "name" ? "ring-1 ring-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.12)]" : ""
                }`}
              >
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setIsFocused("name")}
                  onBlur={() => setIsFocused(null)}
                  placeholder="Ada Lovelace"
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/60 focus:bg-zinc-950"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Email address
              </label>
              <div
                className={`relative rounded-xl transition-all duration-200 ${
                  isFocused === "email" ? "ring-1 ring-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.12)]" : ""
                }`}
              >
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setIsFocused("email")}
                  onBlur={() => setIsFocused(null)}
                  placeholder="ada@example.com"
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/60 focus:bg-zinc-950"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                Password
              </label>
              <div
                className={`relative rounded-xl transition-all duration-200 ${
                  isFocused === "password" ? "ring-1 ring-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.12)]" : ""
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setIsFocused("password")}
                  onBlur={() => setIsFocused(null)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-4 py-2.5 pr-11 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/60 focus:bg-zinc-950"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 transition-colors hover:text-teal-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {capsLockActive && (
                <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                  ⚠️ Caps Lock is active
                </p>
              )}

              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          strength >= step ? strengthColors[strength - 1] : "bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400">
                    {strengthLabels[strength - 1] || "Too short"}
                  </span>
                </div>
              )}
            </div>

            {/* Role Selection Cards */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  Select your role(s)
                </label>
                <span className="text-[10px] text-zinc-500">Pick one or multiple</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = roles.includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => toggleRole(opt.value)}
                      className={`relative flex flex-col items-start rounded-xl border p-2.5 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-teal-400/60 bg-teal-400/[0.1] shadow-[0_0_16px_rgba(45,212,191,0.1)]"
                          : "border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-950/80"
                      }`}
                    >
                      <div className="mb-2 flex w-full items-center justify-between">
                        <div
                          className={`rounded-lg p-1.5 ${
                            isSelected
                              ? "bg-teal-400/20 text-teal-300"
                              : "bg-zinc-800/60 text-zinc-400"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? "border-teal-400 bg-teal-400 text-zinc-950"
                              : "border-zinc-700 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold leading-tight ${
                          isSelected ? "text-teal-200" : "text-zinc-200"
                        }`}
                      >
                        {opt.title}
                      </span>
                      <span className="mt-0.5 text-[9.5px] leading-tight text-zinc-500 line-clamp-2">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
              >
                {error}
              </motion.div>
            )}

            {/* Primary Submit */}
            <motion.button
              type="submit"
              disabled={loading || roles.length === 0}
              whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              className="group relative mt-1 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-teal-500/20 px-4 py-3 text-sm font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/40 transition-all duration-300 hover:bg-teal-500/30 hover:shadow-[0_0_28px_rgba(45,212,191,0.2)] hover:ring-teal-400/60 disabled:opacity-50"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-teal-300/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </motion.div>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800/80" />
            <span className="text-[11px] text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800/80" />
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/40 bg-zinc-800/30 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-all duration-300 hover:border-zinc-600/50 hover:bg-zinc-800/50 hover:text-zinc-100"
          >
            Already have an account? Sign in
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-teal-400" />
          </Link>

          {/* Security footnote badge */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400/70" />
            <span>Encrypted credentials & digital rights secured</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}