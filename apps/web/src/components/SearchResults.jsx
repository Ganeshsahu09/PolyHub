import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Search,
  ArrowLeft,
  Grid,
  List,
  Sparkles,
  Scale,
  Box,
} from "lucide-react";
import { useLiveModels } from "../hooks/useCatalog";

const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low"];

function ModelThumbnail({ seed = 1, forceSquare = false }) {
  const a = (seed * 37) % 40;
  const b = (seed * 53) % 30;
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 transition-colors group-hover:border-teal-400/30 ${forceSquare ? "h-full w-full" : "aspect-[4/3] w-full"}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 120 100"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <polygon
          points={`60,${10 + a * 0.2} ${100 - b * 0.3},${30 + a * 0.1} ${100 - b * 0.3},${70} 60,${90 - a * 0.1} ${20 + b * 0.3},${70} ${20 + b * 0.3},${30 + a * 0.1}`}
          stroke="#2DD4BF"
          strokeWidth="1.5"
          strokeOpacity="0.7"
          fill="#2DD4BF"
          fillOpacity="0.04"
        />
        <line x1="60" y1="10" x2="60" y2="90" stroke="#2DD4BF" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
        <circle cx="60" cy="50" r="4" fill="#2DD4BF" fillOpacity="0.8" />
      </motion.svg>
      {!forceSquare && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 backdrop-blur-sm">
          <Box className="h-3 w-3 text-teal-400" /> 3D Model
        </div>
      )}
    </div>
  );
}

export default function SearchResults({ initialQuery = "", onViewChange }) {
  const { models, loading, error } = useLiveModels();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSort, setSelectedSort] = useState("Newest");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(models.map((m) => m.category))).filter(Boolean);
    return ["All Categories", ...unique];
  }, [models]);

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let processed = models.filter((item) => {
      const haystack = [item.title, item.description, ...(item.tags || [])].join(" ").toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory;
      const price = Number(item.priceBase);
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && price === 0) ||
        (priceFilter === "paid" && price > 0);
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (selectedSort === "Price: Low to High") {
      processed = [...processed].sort((a, b) => Number(a.priceBase) - Number(b.priceBase));
    } else if (selectedSort === "Price: High to Low") {
      processed = [...processed].sort((a, b) => Number(b.priceBase) - Number(a.priceBase));
    } else {
      processed = [...processed].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return processed;
  }, [models, searchQuery, selectedCategory, priceFilter, selectedSort]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-red-400">Failed to load: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 font-sans text-zinc-100 antialiased sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewChange && onViewChange("buyer-home")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">Search Models</h1>
              <p className="text-xs text-zinc-500">
                Found {filteredResults.length} matching model{filteredResults.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, tags..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-900 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showFilters || priceFilter !== "all"
                  ? "border-teal-500/30 bg-teal-500/10 text-teal-300"
                  : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>

            <div className="hidden items-center gap-1.5 md:flex">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "All Categories" : cat)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    selectedCategory === cat
                      ? "bg-zinc-100 text-zinc-950 font-medium"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="cursor-pointer border-none bg-transparent font-medium text-zinc-200 outline-none hover:text-teal-400"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-zinc-900 text-zinc-300">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-teal-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-zinc-800 text-teal-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-400">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-300 focus:border-teal-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-400">Price</label>
                  <div className="flex gap-2">
                    {["all", "free", "paid"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriceFilter(p)}
                        className={`flex-1 rounded-md border py-1.5 text-xs capitalize transition-colors ${
                          priceFilter === p
                            ? "border-teal-500/40 bg-teal-500/10 text-teal-300"
                            : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredResults.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResults.map((item, i) => {
                const price = Number(item.priceBase);
                const seed = item.id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 10;
                return (
                  <div
                    key={item.id}
                    onClick={() => onViewChange && onViewChange("buyer-detail", item.id)}
                    className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900/30"
                  >
                    <div>
                      <ModelThumbnail seed={seed} />
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-sm font-medium text-zinc-100 transition-colors group-hover:text-teal-400">
                            {item.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-zinc-500">by {item.designer?.user?.name || "Unknown"}</p>
                        </div>
                        <span className="shrink-0 rounded border border-teal-500/10 bg-teal-500/5 px-2 py-0.5 font-mono text-xs font-semibold text-teal-300">
                          {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {(item.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-2.5 text-[11px] text-zinc-500">
                      <span className="font-mono">{item.category}</span>
                      <span className="flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        {item.licenseType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((item) => {
                const price = Number(item.priceBase);
                const seed = item.id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 10;
                return (
                  <div
                    key={item.id}
                    onClick={() => onViewChange && onViewChange("buyer-detail", item.id)}
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-3 transition-all hover:border-teal-500/30 hover:bg-zinc-900/30"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                      <ModelThumbnail seed={seed} forceSquare />
                    </div>
                    <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-4 md:grid-cols-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-teal-400">
                          {item.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          by {item.designer?.user?.name || "Unknown"} · <span className="font-mono text-zinc-600">{item.licenseType}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(item.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs font-mono text-zinc-400 md:justify-end">
                        <span>{item.category}</span>
                        <span className="min-w-[45px] text-right font-semibold text-teal-300">
                          {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-900 bg-zinc-900/10 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-500">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No matching models</p>
            <p className="mt-1 max-w-xs text-xs text-zinc-600">
              Try a different search term, or clear your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}