import React from "react";
import { Link } from "react-router-dom";
import { Package, X, ExternalLink, AlertCircle } from "lucide-react";
import { useMyOrders } from "../hooks/useMyOrders";

// Matches the real OrderStatus enum on the backend — nothing invented here.
const STATUS_STYLES = {
  PENDING: "bg-zinc-800 text-zinc-300",
  MATCHED: "bg-sky-400/10 text-sky-300 ring-1 ring-inset ring-sky-400/30",
  PRINTING: "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30",
  SHIPPED: "bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/30",
  DELIVERED: "bg-teal-400/20 text-teal-200 ring-1 ring-inset ring-teal-400/40",
  CANCELLED: "bg-zinc-800 text-zinc-500",
  DISPUTED: "bg-red-400/10 text-red-300 ring-1 ring-inset ring-red-400/30",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${
        STATUS_STYLES[status] || "bg-zinc-800 text-zinc-400"
      }`}
    >
      {status}
    </span>
  );
}

function OrderRow({ order, onCancel, cancelling }) {
  const total = order.finalCost ?? order.estimatedCost;
  const paid = order.payment?.status === "PAID";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-zinc-100">
            {order.model?.title || "Untitled model"}
          </p>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Qty {order.quantity} ·{" "}
          {total != null ? `$${Number(total).toFixed(2)}` : "—"} ·{" "}
          {paid ? (
            <span className="text-teal-400">Paid</span>
          ) : (
            <span className="text-amber-400">Unpaid</span>
          )}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-600">
          {new Date(order.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          · {order.id.slice(0, 8)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {order.model?.id && (
          <Link
            to={`/buyer/model/${order.model.id}`}
            className="flex items-center gap-1 rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-teal-400/40 hover:text-teal-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View model
          </Link>
        )}
        {order.status === "PENDING" && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={cancelling}
            className="flex items-center gap-1 rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BuyerOrders() {
  const { orders, loading, error, cancelOrder, cancellingId, cancelError } = useMyOrders();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-950 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-zinc-300">Couldn't load your orders</p>
        <p className="text-xs text-zinc-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 font-sans text-zinc-100 antialiased sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">My Orders</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-500">
          Everything you've ordered on PolyHub, most recent first.
        </p>

        {cancelError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {cancelError}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/20 px-5 py-16 text-center">
            <Package className="h-6 w-6 text-zinc-600" />
            <p className="text-sm text-zinc-500">You haven't placed any orders yet</p>
            <Link
              to="/buyer"
              className="mt-2 rounded-md bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-teal-300"
            >
              Browse models
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onCancel={cancelOrder}
                cancelling={cancellingId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}