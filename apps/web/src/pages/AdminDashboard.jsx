import React, { useState } from "react";
import {
  ShieldAlert,
  Flag,
  Users as UsersIcon,
  AlertCircle,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useAdminDashboard } from "../hooks/useAdminDashboard";

const TABS = [
  { id: "models", label: "Models", icon: Package },
  { id: "disputed", label: "Disputed Orders", icon: ShieldAlert },
  { id: "users", label: "Users", icon: UsersIcon },
];

const MODEL_STATUS_STYLES = {
  DRAFT: "bg-zinc-800 text-zinc-400",
  LIVE: "bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/30",
  FLAGGED: "bg-red-400/10 text-red-300 ring-1 ring-inset ring-red-400/30",
  ARCHIVED: "bg-zinc-800 text-zinc-500",
};

function ModelsTab({ models, flagModel, unflagModel, flaggingId }) {
  if (models.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">No models published yet.</p>;
  }

  return (
    <div className="space-y-2">
      {models.map((m) => (
        <div
          key={m.id}
          className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-zinc-100">{m.title}</p>
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
                  MODEL_STATUS_STYLES[m.status] || "bg-zinc-800 text-zinc-400"
                }`}
              >
                {m.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              by {m.designer?.user?.name || "Unknown designer"} · {m.category} · $
              {Number(m.priceBase).toFixed(2)}
            </p>
          </div>

          <div className="shrink-0">
            {m.status === "FLAGGED" ? (
              <button
                onClick={() => unflagModel(m.id)}
                disabled={flaggingId === m.id}
                className="flex items-center gap-1.5 rounded-md bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-teal-300 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {flaggingId === m.id ? "Unflagging..." : "Unflag"}
              </button>
            ) : (
              <button
                onClick={() => flagModel(m.id)}
                disabled={flaggingId === m.id}
                className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
              >
                <Flag className="h-3.5 w-3.5" />
                {flaggingId === m.id ? "Flagging..." : "Flag"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DisputedOrdersTab({ orders }) {
  if (orders.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">No disputed orders right now.</p>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-100">{o.model?.title || "Untitled model"}</p>
            <span className="rounded-md bg-red-400/10 px-2 py-0.5 font-mono text-[10px] font-medium text-red-300 ring-1 ring-inset ring-red-400/30">
              DISPUTED
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Buyer: {o.buyer?.name || o.buyer?.email || "Unknown"} · Qty {o.quantity}
          </p>
          {o.printJob?.failureReason && (
            <p className="mt-2 rounded-md bg-zinc-950/50 px-2.5 py-1.5 font-mono text-[11px] text-red-300">
              {o.printJob.failureReason}
            </p>
          )}
          <p className="mt-2 font-mono text-[11px] text-zinc-600">
            Updated {new Date(o.updatedAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ users }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900/60 text-xs text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Email</th>
            <th className="px-4 py-2.5 font-medium">Roles</th>
            <th className="px-4 py-2.5 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map((u) => (
            <tr key={u.id} className="text-zinc-300">
              <td className="px-4 py-2.5">{u.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{u.email}</td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span
                      key={r.id}
                      className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                    >
                      {r.role}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-600">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const { models, disputedOrders, users, loading, error, actionError, flaggingId, flagModel, unflagModel } =
    useAdminDashboard();
  const [tab, setTab] = useState("models");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-950 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-zinc-300">Couldn't load the admin dashboard</p>
        <p className="text-xs text-zinc-600">{error}</p>
      </div>
    );
  }

  const counts = { models: models.length, disputed: disputedOrders.length, users: users.length };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 font-sans text-zinc-100 antialiased sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Admin</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">
          Moderate models, review disputes, and see who's on PolyHub.
        </p>

        {actionError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        )}

        <div className="mb-5 flex gap-2 border-b border-zinc-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                  {counts[t.id === "disputed" ? "disputed" : t.id]}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "models" && (
          <ModelsTab
            models={models}
            flagModel={flagModel}
            unflagModel={unflagModel}
            flaggingId={flaggingId}
          />
        )}
        {tab === "disputed" && <DisputedOrdersTab orders={disputedOrders} />}
        {tab === "users" && <UsersTab users={users} />}
      </div>
    </div>
  );
}