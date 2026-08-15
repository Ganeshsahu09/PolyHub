import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, FolderGit2 } from "lucide-react";
import { api } from "../lib/api";

export default function DiscoverDesigners() {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/designers")
      .then(setDesigners)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading designers...</p>
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
    <div className="min-h-screen bg-zinc-950 px-4 py-10 font-sans text-zinc-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 text-xl font-semibold">Discover Designers</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Browse designers publishing models on PolyHub.
        </p>

        {designers.length === 0 ? (
          <p className="text-sm text-zinc-500">No designers with published models yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {designers.map((d) => {
              const initials = d.user.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <Link
                  key={d.user.id}
                  to={`/designers/${d.user.id}`}
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-teal-400/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-sky-500/20 font-mono text-sm font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/30">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{d.user.name}</p>
                    {d.bio && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{d.bio}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="h-3 w-3" />
                        {d.liveModelCount} models
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {d.followerCount} followers
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}