import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, FolderGit2, Check, Scale } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function DesignerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, followers] = await Promise.all([
        api.get(`/designers/${id}/profile`),
        api.get(`/designers/${id}/followers`),
      ]);
      setProfile(profileData);
      setIsFollowing(user ? followers.some((f) => f.id === user.id) : false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFollow() {
    if (!user) return;
    if (isFollowing) {
      await api.del(`/designers/${id}/follow`);
    } else {
      await api.post(`/designers/${id}/follow`);
    }
    await load();
  }

  async function requestLicense(modelId) {
    const message = window.prompt("Optional message to the designer:");
    try {
      await api.post(`/models/${modelId}/request-license`, { message: message || undefined });
      window.alert("License request sent.");
    } catch (err) {
      window.alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-red-400">Failed to load profile: {error}</p>
      </div>
    );
  }

  const isOwnProfile = user && user.id === id;
  const initials = profile.user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 font-sans text-zinc-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/discover" className="mb-6 inline-block text-xs text-zinc-500 hover:text-zinc-300">
          ← Back to Discover
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-sky-500/20 font-mono text-xl font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/30">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-zinc-50">{profile.user.name}</h1>
            {profile.bio && <p className="mt-1 text-sm text-zinc-400">{profile.bio}</p>}
            <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
              <Users className="h-3.5 w-3.5" />
              <span className="font-mono text-zinc-300">{profile.followerCount}</span>
              followers
            </div>
          </div>

          {!isOwnProfile && user && (
            <button
              onClick={toggleFollow}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                isFollowing
                  ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-red-500/40 hover:text-red-300"
                  : "border-teal-400/50 bg-teal-400 text-zinc-950 hover:bg-teal-300"
              }`}
            >
              {isFollowing ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FolderGit2 className="h-3.5 w-3.5 text-teal-400" />
          Published Models
        </h2>

        {profile.models.length === 0 ? (
          <p className="text-sm text-zinc-500">No published models yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profile.models.map((model) => (
              <div
                key={model.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
              >
                <p className="text-sm font-medium text-zinc-100">{model.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{model.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                    {model.category}
                  </span>
                  <span className="flex items-center gap-1 rounded-md border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                    <Scale className="h-2.5 w-2.5" />
                    {model.licenseType}
                  </span>
                  <span className="ml-auto font-mono text-xs text-teal-300">
                    ${Number(model.priceBase).toFixed(2)}
                  </span>
                </div>

                {!isOwnProfile && user && user.roles?.includes("DESIGNER") && (
                  <button
                    onClick={() => requestLicense(model.id)}
                    className="mt-3 w-full rounded-md border border-zinc-800 py-1.5 text-xs font-medium text-zinc-400 hover:border-teal-400/40 hover:text-teal-300"
                  >
                    Request License
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}