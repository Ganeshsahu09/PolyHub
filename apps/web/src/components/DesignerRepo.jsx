import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Search,
  Plus,
  X,
  Box,
  FileBox,
  FileText,
  MapPin,
  Calendar,
  Users,
  LayoutGrid,
  FolderGit2,
  UploadCloud,
  File,
  Scale,
  Inbox,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesignerRepo } from "../hooks/useDesignerRepo";
import { api } from "../lib/api";

const LICENSE_TYPES = [
  { value: "PERSONAL_USE", label: "Personal Use" },
  { value: "COMMERCIAL_USE", label: "Commercial Use" },
  { value: "EXCLUSIVE", label: "Exclusive" },
];

function modelToRepo(model, starredIds) {
  const filename = model.fileKey ? model.fileKey.split("/").pop() : "model.glb";
  return {
    id: model.id,
    name: model.title,
    description: model.description,
    type: model.category,
    license: model.licenseType,
    price: model.priceBase,
    tags: model.tags || [],
    starredByUser: starredIds.has(model.id),
    status: model.status,
    updated: model.updatedAt ? new Date(model.updatedAt).toLocaleDateString() : "just now",
    files: [{ name: filename, size: "—" }],
  };
}

function fileIcon(filename) {
  if (filename.endsWith(".step") || filename.endsWith(".fcstd")) return FileBox;
  if (filename.endsWith(".stl") || filename.endsWith(".glb") || filename.endsWith(".obj")) return Box;
  if (filename.endsWith(".md")) return FileText;
  return File;
}

function ProfilePanel({ user, followerCount }) {
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="space-y-5">
      <div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-sky-500/20 font-mono text-2xl font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/30">
          {initials}
        </div>
        <h1 className="mt-3 text-lg font-semibold text-zinc-50">{user.name}</h1>
        <p className="font-mono text-sm text-zinc-500">{user.email}</p>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-zinc-400">
        <Users className="h-3.5 w-3.5 text-zinc-500" />
        <span className="font-mono font-medium text-zinc-200">{followerCount}</span>
        followers
      </div>

      <div className="space-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          Location not set
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          PolyHub designer
        </div>
      </div>
    </div>
  );
}

function RepoCard({ repo, onToggleStar, onEdit, onDelete, showOwnerActions = false, compact = false }) {
  const navigate = useNavigate();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/buyer/model/${repo.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/buyer/model/${repo.id}`);
      }}
      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 shrink-0 text-teal-400" />
            <span className="truncate font-mono text-sm font-medium text-zinc-100">{repo.name}</span>
            {repo.status && repo.status !== "LIVE" && (
              <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                {repo.status}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{repo.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {showOwnerActions && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(repo);
                }}
                aria-label="Edit model"
                className="flex items-center rounded-md border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-teal-400/40 hover:text-teal-300"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(repo);
                }}
                aria-label="Delete model"
                className="flex items-center rounded-md border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-red-500/40 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(repo.id);
            }}
            aria-pressed={repo.starredByUser}
            aria-label="Toggle star"
            className="flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1.5 text-zinc-400 transition-colors hover:border-teal-400/40 hover:text-teal-300"
          >
            <Star className={`h-3.5 w-3.5 transition-colors ${repo.starredByUser ? "fill-teal-400 text-teal-400" : "fill-none"}`} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {repo.type && (
          <span className="rounded-md border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            {repo.type}
          </span>
        )}
        {repo.license && (
          <span className="flex items-center gap-1 rounded-md border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            <Scale className="h-2.5 w-2.5" />
            {repo.license}
          </span>
        )}
        {!compact &&
          repo.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-800/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
              #{tag}
            </span>
          ))}
        <span className="ml-auto font-mono text-[10px] text-zinc-600">
          {repo.files.length} files · {repo.updated}
        </span>
      </div>
    </motion.div>
  );
}

function OverviewTab({ repos, onToggleStar, onEdit, onDelete }) {
  const recent = repos.slice(0, 4);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Star className="h-3.5 w-3.5 text-teal-400" />
          Recent Models
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You haven't published any models yet — use "New Repository" to upload your first one.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recent.map((repo) => (
              <RepoCard key={repo.id} repo={repo} onToggleStar={onToggleStar} onEdit={onEdit} onDelete={onDelete} showOwnerActions compact />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RepositoriesTab({ repos, onToggleStar, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((repo) => {
      const haystack = [repo.name, repo.description, ...repo.tags].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [repos, query]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search your models..."
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/30"
        />
      </div>

      <p className="font-mono text-[11px] text-zinc-600">{filtered.length} of {repos.length} models</p>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((repo) => (
              <RepoCard key={repo.id} repo={repo} onToggleStar={onToggleStar} onEdit={onEdit} onDelete={onDelete} showOwnerActions />
            ))
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-800 px-5 py-10 text-center">
              <Search className="h-5 w-5 text-zinc-600" />
              <p className="text-sm text-zinc-500">No models match your search</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StarredTab({ starredRepos, onToggleStar }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
      <p className="font-mono text-[11px] text-zinc-600">{starredRepos.length} starred models</p>
      <AnimatePresence mode="popLayout">
        {starredRepos.length > 0 ? (
          starredRepos.map((repo) => <RepoCard key={repo.id} repo={repo} onToggleStar={onToggleStar} />)
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-800 px-5 py-10 text-center">
            <Star className="h-5 w-5 text-zinc-600" />
            <p className="text-sm text-zinc-500">No starred models yet</p>
            <p className="text-xs text-zinc-600">Star a model from the marketplace to pin it here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RequestsTab({ requests, onRespond }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-800 px-5 py-10 text-center">
          <Inbox className="h-5 w-5 text-zinc-600" />
          <p className="text-sm text-zinc-500">No incoming license requests</p>
        </div>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-200">
                  <span className="font-medium">{req.requester.name}</span> wants to license{" "}
                  <span className="font-medium text-teal-300">{req.model.title}</span>
                </p>
                {req.message && <p className="mt-1 text-xs text-zinc-500">"{req.message}"</p>}
              </div>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] ${req.status === "PENDING" ? "bg-amber-400/10 text-amber-300" : req.status === "APPROVED" ? "bg-teal-400/10 text-teal-300" : "bg-zinc-800 text-zinc-500"}`}>
                {req.status}
              </span>
            </div>
            {req.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => onRespond(req.id, "approve")} className="rounded-md bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-300 ring-1 ring-inset ring-teal-400/30 hover:bg-teal-400/20">
                  Approve
                </button>
                <button onClick={() => onRespond(req.id, "decline")} className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-200">
                  Decline
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </motion.div>
  );
}

function NewRepositoryModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priceBase, setPriceBase] = useState("");
  const [licenseType, setLicenseType] = useState(LICENSE_TYPES[0].value);
  const [file, setFile] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDraggingOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDraggingOver(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }, []);
  const handleFileInput = (e) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  };

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length >= 10 &&
    category.trim().length > 0 &&
    priceBase !== "" &&
    file !== null &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ title: title.trim(), description: description.trim(), category: category.trim(), priceBase, licenseType, file });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <FolderGit2 className="h-4 w-4 text-teal-400" />
            Upload New Model
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="e.g. Modular Headphone Stand" className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/30" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description (min 10 characters)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does this model do, and who is it for?" className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} type="text" placeholder="e.g. Accessories" className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Price (USD)</label>
              <input value={priceBase} onChange={(e) => setPriceBase(e.target.value)} type="number" step="0.01" min="0" placeholder="4.99" className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-teal-400/50" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Scale className="h-3 w-3" />
              License
            </label>
            <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className="w-full cursor-pointer appearance-none rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-teal-400/50">
              {LICENSE_TYPES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">3D file (.glb, .stl, or .obj)</label>
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${isDraggingOver ? "border-teal-400 bg-teal-400/[0.06]" : "border-zinc-700 bg-zinc-950/40"}`}
            >
              <input type="file" accept=".glb,.stl,.obj" onChange={handleFileInput} className="hidden" />
              <UploadCloud className={`h-6 w-6 transition-colors ${isDraggingOver ? "text-teal-300" : "text-zinc-500"}`} />
              <p className="text-sm text-zinc-400">
                {file ? file.name : isDraggingOver ? "Drop to select" : "Drag a file here or click to browse"}
              </p>
            </label>

            {file && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(() => {
                  const Icon = fileIcon(file.name);
                  return (
                    <span className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-1 font-mono text-[11px] text-zinc-300">
                      <Icon className="h-3 w-3 text-teal-400" />
                      {file.name}
                      <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="text-zinc-500 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={!canSubmit} className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${canSubmit ? "bg-teal-400 text-zinc-950 hover:bg-teal-300" : "cursor-not-allowed bg-zinc-800 text-zinc-600"}`}>
            <Plus className="h-4 w-4" />
            {submitting ? "Uploading..." : "Upload & Publish"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function EditModelModal({ repo, onClose, onSave }) {
  const [title, setTitle] = useState(repo.name);
  const [description, setDescription] = useState(repo.description);
  const [category, setCategory] = useState(repo.type || "");
  const [priceBase, setPriceBase] = useState(repo.price ?? "");
  const [licenseType, setLicenseType] = useState(repo.license || LICENSE_TYPES[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    category.trim().length > 0 &&
    priceBase !== "" &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSave(repo.id, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priceBase: Number(priceBase),
        licenseType,
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Pencil className="h-4 w-4 text-teal-400" />
            Edit Model
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/30" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description (min 10 characters)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} type="text" className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-teal-400/50" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Price (USD)</label>
              <input value={priceBase} onChange={(e) => setPriceBase(e.target.value)} type="number" step="0.01" min="0" className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-teal-400/50" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Scale className="h-3 w-3" />
              License
            </label>
            <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className="w-full cursor-pointer appearance-none rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-teal-400/50">
              {LICENSE_TYPES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={!canSubmit} className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${canSubmit ? "bg-teal-400 text-zinc-950 hover:bg-teal-300" : "cursor-not-allowed bg-zinc-800 text-zinc-600"}`}>
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ repo, onClose, onConfirm }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await onConfirm(repo.id, password);
      setResult(res);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm" onClick={result ? onClose : undefined}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-red-400">
            <Trash2 className="h-4 w-4" />
            Delete Model
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="space-y-3 px-5 py-5">
            <div className="flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-400/5 p-3 text-teal-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-xs">
                {result.archived
                  ? "This model has order history, so it was archived rather than deleted — it no longer appears anywhere public, but past orders stay valid."
                  : "The model was permanently deleted."}
              </p>
            </div>
            <button onClick={onClose} className="w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <p className="text-sm text-zinc-400">
              You're about to delete <span className="font-medium text-zinc-200">{repo.name}</span>. This can't be undone
              from the UI. Confirm your password to continue.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!password || submitting}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  password && !submitting ? "bg-red-500 text-white hover:bg-red-400" : "cursor-not-allowed bg-zinc-800 text-zinc-600"
                }`}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "repositories", label: "My Models", icon: FolderGit2 },
  { id: "starred", label: "Starred", icon: Star },
  { id: "requests", label: "Requests", icon: Inbox },
];

export default function DesignerRepo() {
  const { user } = useAuth();
  const {
    models,
    followers,
    starredModels,
    incomingRequests,
    loading,
    error,
    uploadModel,
    respondToLicenseRequest,
    updateModel,
    deleteModel,
    refresh,
  } = useDesignerRepo(user);

  const [activeTab, setActiveTab] = useState("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState(null);
  const [deletingRepo, setDeletingRepo] = useState(null);

  const starredIds = useMemo(() => new Set(starredModels.map((m) => m.id)), [starredModels]);
  const repos = useMemo(() => models.map((m) => modelToRepo(m, starredIds)), [models, starredIds]);
  const starredRepos = useMemo(() => starredModels.map((m) => modelToRepo(m, starredIds)), [starredModels, starredIds]);

  const handleToggleStar = useCallback(async (modelId) => {
    await api.post(`/models/${modelId}/star`);
    await refresh();
  }, [refresh]);

  const handleCreateRepo = useCallback(async ({ title, description, category, priceBase, licenseType, file }) => {
    await uploadModel({ file, title, description, category, priceBase, licenseType, tags: [] });
    setModalOpen(false);
    setActiveTab("repositories");
  }, [uploadModel]);

  const handleRespondToRequest = useCallback(async (grantId, action) => {
    await respondToLicenseRequest(grantId, action);
  }, [respondToLicenseRequest]);

  const handleSaveEdit = useCallback(async (modelId, patch) => {
    await updateModel(modelId, patch);
    setEditingRepo(null);
  }, [updateModel]);

  const handleConfirmDelete = useCallback(async (modelId, password) => {
    return deleteModel(modelId, password);
  }, [deleteModel]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading your repository...</p>
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
    <div className="min-h-screen bg-zinc-950 px-4 py-10 font-sans text-zinc-100 antialiased sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:border-r lg:border-zinc-800 lg:pr-8">
            <ProfilePanel user={user} followerCount={followers.length} />
          </aside>

          <main>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const count =
                    tab.id === "repositories" ? repos.length :
                    tab.id === "starred" ? starredRepos.length :
                    tab.id === "requests" ? incomingRequests.filter((r) => r.status === "PENDING").length :
                    null;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-teal-300" : "text-zinc-500 hover:text-zinc-300"}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                      {count !== null && count > 0 && (
                        <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${isActive ? "bg-teal-400/10 text-teal-300" : "bg-zinc-800 text-zinc-500"}`}>
                          {count}
                        </span>
                      )}
                      {isActive && <motion.div layoutId="designerRepoTabUnderline" className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-teal-400" />}
                    </button>
                  );
                })}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setModalOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-md bg-teal-400 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-teal-300">
                <Plus className="h-4 w-4" />
                New Repository
              </motion.button>
            </div>

            <div className="border-b border-zinc-800" />

            <div className="mt-5">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <OverviewTab key="overview" repos={repos} onToggleStar={handleToggleStar} onEdit={setEditingRepo} onDelete={setDeletingRepo} />
                )}
                {activeTab === "repositories" && (
                  <RepositoriesTab key="repositories" repos={repos} onToggleStar={handleToggleStar} onEdit={setEditingRepo} onDelete={setDeletingRepo} />
                )}
                {activeTab === "starred" && (
                  <StarredTab key="starred" starredRepos={starredRepos} onToggleStar={handleToggleStar} />
                )}
                {activeTab === "requests" && (
                  <RequestsTab key="requests" requests={incomingRequests} onRespond={handleRespondToRequest} />
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && <NewRepositoryModal onClose={() => setModalOpen(false)} onCreate={handleCreateRepo} />}
      </AnimatePresence>

      <AnimatePresence>
        {editingRepo && (
          <EditModelModal repo={editingRepo} onClose={() => setEditingRepo(null)} onSave={handleSaveEdit} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingRepo && (
          <DeleteConfirmModal repo={deletingRepo} onClose={() => setDeletingRepo(null)} onConfirm={handleConfirmDelete} />
        )}
      </AnimatePresence>
    </div>
  );
}