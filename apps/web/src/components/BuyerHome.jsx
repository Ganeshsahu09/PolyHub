import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ShoppingCart,
  Sparkles,
  Box,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLiveModels } from "../hooks/useCatalog";

const CATEGORIES = ["All Categories", "Home & Decor", "Mechanical Parts", "Miniatures & Tabletop", "Tools & Fixtures", "Tech Accessories", "Art & Sculpture", "Accessories"];

function ModelViewerPlaceholder({ seed = 1 }) {
  const a = (seed * 37) % 40;
  const b = (seed * 53) % 30;
  const rotateDuration = 14 + (seed % 5) * 2;

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-2xl" />

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotate: 360 }}
        transition={{ duration: rotateDuration, repeat: Infinity, ease: "linear" }}
      >
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          <polygon
            points={`60,${10 + a * 0.2} ${100 - b * 0.3},${30 + a * 0.1} ${100 - b * 0.3},${70}60,${90 - a * 0.1} ${20 + b * 0.3},${70} ${20 + b * 0.3},${30 + a * 0.1}`}
            stroke="#2DD4BF" strokeWidth="1" strokeOpacity="0.55" fill="#2DD4BF" fillOpacity="0.04"
          />
          <line x1="60" y1={10 + a * 0.2} x2="60" y2={50} stroke="#2DD4BF" strokeOpacity="0.35" strokeWidth="1" />
          <line x1={20 + b * 0.3} y1={30 + a * 0.1} x2="60" y2="50" stroke="#2DD4BF" strokeOpacity="0.35" strokeWidth="1" />
          <line x1={100 - b * 0.3} y1={30 + a * 0.1} x2="60" y2="50" stroke="#2DD4BF" strokeOpacity="0.35" strokeWidth="1" />
          <line x1="60" y1="50" x2="60" y2={90 - a * 0.1} stroke="#2DD4BF" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="60" cy="50" r="2" fill="#2DD4BF" fillOpacity="0.8" />
        </svg>
      </motion.div>

      <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-zinc-950/70 px-1.5 py-0.5 backdrop-blur-sm">
        <Box className="h-3 w-3 text-zinc-500" strokeWidth={2} />
        <span className="font-mono text-[10px] text-zinc-500">3D</span>
      </div>
    </div>
  );
}

function ModelCard({ model, index, onClick }) {
  const seed = model.id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 10;
  const price = Number(model.priceBase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-teal-400/40"
    >
      <ModelViewerPlaceholder seed={seed} />
      <div className="flex flex-col gap-2.5 p-4">
        <h3 className="text-sm font-medium leading-snug text-zinc-100 group-hover:text-teal-300 transition-colors">
          {model.title}
        </h3>
        <p className="text-xs text-zinc-500">
          by <span className="text-zinc-400 hover:text-teal-300 transition-colors">{model.designer?.user?.name || "Unknown designer"}</span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="rounded-md border border-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
            {model.category}
          </span>
          <span className="font-mono text-sm font-medium text-zinc-200">
            {price === 0 ? "Free" : `$${price.toFixed(2)}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TopNav({ selectedCategory, onSelectCategory }) {
  const { user } = useAuth();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-400/10 ring-1 ring-inset ring-teal-400/30">
            <Box className="h-4 w-4 text-teal-300" strokeWidth={2.25} />
          </div>
          <span className="hidden text-[15px] font-semibold tracking-tight text-zinc-100 sm:block">
            Poly<span className="text-teal-300">Hub</span>
          </span>
        </div>

        <div ref={dropdownRef} className="relative hidden shrink-0 lg:block">
          <button
            onClick={() => setCategoryOpen((p) => !p)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700"
          >
            {selectedCategory}
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {categoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl shadow-black/40"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onSelectCategory(cat);
                      setCategoryOpen(false);
                    }}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-left text-xs transition-colors ${
                      selectedCategory === cat ? "bg-teal-400/10 text-teal-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-auto w-full max-w-xl" />

        <div className="flex shrink-0 items-center gap-3">
          <button aria-label="Cart" className="relative rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
            <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-sky-500/20 font-mono text-xs font-medium text-teal-200 ring-1 ring-zinc-800">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onSearch }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <section className="relative overflow-hidden border-b border-zinc-800 px-4 pb-20 pt-20 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-teal-400/[0.06] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl"
        >
          Find the model in your head,
          <br />
          not just the words for it.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mx-auto mt-3 max-w-lg text-sm text-zinc-400"
        >
          Search across every model published on PolyHub.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.(query);
          }}
          className="relative mx-auto mt-8"
        >
          <div
            className={`relative flex items-center rounded-xl border bg-zinc-900/80 transition-all ${
              focused ? "border-teal-400/60 shadow-[0_0_0_4px_rgba(45,212,191,0.08)]" : "border-zinc-800"
            }`}
          >
            <Search className="ml-4 h-5 w-5 shrink-0 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              type="text"
              placeholder="Search models by title, description, or tag..."
              className="w-full bg-transparent py-4 pl-3 pr-28 text-sm text-zinc-100 placeholder-zinc-500 outline-none sm:text-[15px]"
            />
            <button
              type="submit"
              className="absolute right-2 flex items-center gap-1.5 rounded-lg bg-teal-400 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Search
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}

function ModelsGrid({ models, loading, error, onCardClick }) {
  if (loading) {
    return <p className="mx-auto max-w-7xl px-4 py-12 text-sm text-zinc-500 sm:px-6">Loading models...</p>;
  }
  if (error) {
    return <p className="mx-auto max-w-7xl px-4 py-12 text-sm text-red-400 sm:px-6">Failed to load: {error}</p>;
  }
  if (models.length === 0) {
    return (
      <p className="mx-auto max-w-7xl px-4 py-12 text-sm text-zinc-500 sm:px-6">
        No models match this view yet — check back soon, or browse a different category.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Browse Models</h2>
          <p className="mt-1 text-sm text-zinc-500">{models.length} live model{models.length === 1 ? "" : "s"} on PolyHub.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model, i) => (
          <ModelCard key={model.id} model={model} index={i} onClick={() => onCardClick(model.id)} />
        ))}
      </div>
    </section>
  );
}

export default function BuyerHome({ onViewChange, onSearchSubmit }) {
  const { models, loading, error } = useLiveModels();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const filteredModels = useMemo(() => {
    if (selectedCategory === "All Categories") return models;
    return models.filter((m) => m.category === selectedCategory);
  }, [models, selectedCategory]);

  const handleSearch = (query) => {
    onSearchSubmit?.(query);
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
      <TopNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      <HeroSection onSearch={handleSearch} />
      <ModelsGrid
        models={filteredModels}
        loading={loading}
        error={error}
        onCardClick={(modelId) => onViewChange?.("buyer-detail", modelId)}
      />
    </div>
  );
}