import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  Hexagon,
  Sparkles,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Palette,
  Printer,
  KeyRound,
  X,
  Mail,
  CheckCircle2,
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

export default function Login() {
  const { login, mockLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(null);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const prefersReducedMotion = useReducedMotion();
  const { smoothX, smoothY } = useMouseGlow(containerRef);

  function handleKeyDown(e) {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.roles.includes("DESIGNER")) navigate("/designer");
      else if (user.roles.includes("PRINTER_OWNER")) navigate("/printer");
      else navigate("/buyer");
    } catch {
      // error is captured in context
    }
  }

  function handleQuickDemo(role) {
    const user = mockLogin(role);
    if (user.roles.includes("DESIGNER")) navigate("/designer");
    else if (user.roles.includes("PRINTER_OWNER")) navigate("/printer");
    else navigate("/buyer");
  }

  function handleOpenForgotModal() {
    setForgotEmail(email || "");
    setForgotSent(false);
    setForgotError("");
    setShowForgotModal(true);
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    setForgotSending(true);
    setForgotError("");

    // Simulate sending reset email
    await new Promise((resolve) => setTimeout(resolve, 800));
    setForgotSending(false);
    setForgotSent(true);
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
        className="relative z-10 w-full max-w-[440px]"
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
              <span>v2.4</span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              Sign in to PolyHub
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Access digital assets, orders, and 3D printing fleets
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused("email")}
                  onBlur={() => setIsFocused(null)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/70 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/60 focus:bg-zinc-950"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-[11px] font-medium text-teal-400/90 transition-colors hover:text-teal-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div
                className={`relative rounded-xl transition-all duration-200 ${
                  isFocused === "password" ? "ring-1 ring-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.12)]" : ""
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused("password")}
                  onBlur={() => setIsFocused(null)}
                  placeholder="••••••••"
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
            </div>

            {/* Error banner */}
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
              disabled={loading}
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
                      <LogIn className="h-4 w-4" />
                    </motion.div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Quick Demo Role Section (Instant 1-Click Exploration) */}
          <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                <Zap className="h-3 w-3 text-teal-400" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-zinc-500">No backend needed</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("BUYER")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-[11px] font-medium text-zinc-300 transition-all hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-200"
              >
                <ShoppingBag className="h-3 w-3 text-teal-400" />
                Buyer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("DESIGNER")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-[11px] font-medium text-zinc-300 transition-all hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-200"
              >
                <Palette className="h-3 w-3 text-teal-400" />
                Designer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("PRINTER_OWNER")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-[11px] font-medium text-zinc-300 transition-all hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-200"
              >
                <Printer className="h-3 w-3 text-teal-400" />
                Printer
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800/80" />
            <span className="text-[11px] text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800/80" />
          </div>

          {/* Sign up CTA */}
          <Link
            to="/register"
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/40 bg-zinc-800/30 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-all duration-300 hover:border-zinc-600/50 hover:bg-zinc-800/50 hover:text-zinc-100"
          >
            Don't have an account? Create one
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-teal-400" />
          </Link>

          {/* Security footnote badge */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400/70" />
            <span>End-to-end encrypted 3D IP protection</span>
          </div>
        </div>
      </motion.div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl shadow-black/80 backdrop-blur-xl sm:p-7"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon & Title */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/20 text-teal-400">
                <KeyRound className="h-5 w-5" />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                Reset your password
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Enter your email address and we'll send you a link to reset your credentials.
              </p>

              {forgotSent ? (
                <div className="mt-5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-400/20 text-teal-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-teal-200">
                    Check your inbox
                  </h3>
                  <p className="mt-1 text-xs text-zinc-300">
                    We've dispatched password recovery instructions to:
                  </p>
                  <p className="mt-1 font-mono text-xs font-medium text-teal-300 break-all">
                    {forgotEmail}
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="mt-5 w-full rounded-xl bg-teal-500/20 py-2.5 text-xs font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/40 hover:bg-teal-500/30 transition-all"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="mt-5 flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      Account email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-zinc-700/70 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/60 focus:bg-zinc-950"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <p className="text-xs text-red-400">{forgotError}</p>
                  )}

                  <div className="mt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotSending}
                      className="flex items-center gap-1.5 rounded-xl bg-teal-500/20 px-4 py-2.5 text-xs font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/40 hover:bg-teal-500/30 transition-all disabled:opacity-50"
                    >
                      {forgotSending ? "Sending link..." : "Send reset link"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}