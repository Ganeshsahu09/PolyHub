import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { usePrinterDashboard } from "../hooks/usePrinterDashboard";
import {
  Power,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Layers,
  MapPin,
  Sparkles,
  Check,
  X,
  ChevronRight,
  Printer,
  PackageCheck,
  ClipboardCheck,
  Truck,
  AlertCircle,
  Box,
  TrendingUp,
} from "lucide-react";

/* ----------------------------------------------------------------------
 * STAGES — matches the 3 real transitions the backend supports
 * (accept -> start -> complete). There's no separate "slicing" timestamp
 * tracked server-side, so we don't fake one here.
 * -------------------------------------------------------------------- */

const STEPPER_STAGES = [
  { id: "accepted", label: "Accepted", icon: ClipboardCheck },
  { id: "printing", label: "Printing", icon: Printer },
  { id: "shipped", label: "Shipped", icon: PackageCheck },
];

/* ----------------------------------------------------------------------
 * SMALL SIMULATED MODEL THUMBNAIL (reused visual language from earlier
 * pages, scaled down — gives orders a sense of "what am I printing")
 * -------------------------------------------------------------------- */

// Derives a stable pseudo-random "seed" from a real job/order id so the
// thumbnail still varies per-job without needing a seed field from the API.
function seedFromId(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return (hash % 9) + 1;
}

function MiniModelThumb({ seed = 1 }) {
  const a = (seed * 37) % 40;
  const b = (seed * 53) % 30;
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
      <motion.svg
        width="34"
        height="30"
        viewBox="0 0 120 100"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      >
        <polygon
          points={`60,${10 + a * 0.2} ${100 - b * 0.3},${30 + a * 0.1} ${100 - b * 0.3},${70} 60,${90 - a * 0.1} ${20 + b * 0.3},${70} ${20 + b * 0.3},${30 + a * 0.1}`}
          stroke="#2DD4BF"
          strokeWidth="2"
          strokeOpacity="0.6"
          fill="#2DD4BF"
          fillOpacity="0.06"
        />
        <circle cx="60" cy="50" r="3" fill="#2DD4BF" fillOpacity="0.8" />
      </motion.svg>
    </div>
  );
}

/* ----------------------------------------------------------------------
 * AVAILABILITY TOGGLE
 * -------------------------------------------------------------------- */

function AvailabilityToggle({ online, onToggle }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-5 py-4 transition-colors ${
        online
          ? "border-teal-400/30 bg-teal-400/[0.06]"
          : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            online ? "bg-teal-400/15" : "bg-zinc-800"
          }`}
        >
          <Power className={`h-5 w-5 ${online ? "text-teal-300" : "text-zinc-500"}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">
            {online ? "Accepting Local Orders" : "Not Accepting Orders"}
          </p>
          <p className="text-xs text-zinc-500">
            {online
              ? "Your printer fleet is visible to nearby buyers"
              : "You're hidden from new order matching"}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        role="switch"
        aria-checked={online}
        aria-label="Toggle accepting orders"
        className={`relative h-7 w-14 shrink-0 rounded-full transition-colors ${
          online ? "bg-teal-400" : "bg-zinc-700"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-0.5 h-6 w-6 rounded-full bg-zinc-950 shadow-md"
          style={{ left: online ? "calc(100% - 26px)" : "2px" }}
        />
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------------
 * OPERATIONAL METRICS BAR
 * -------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, sublabel, accent = false }) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={`mt-1.5 font-mono text-2xl font-semibold ${accent ? "text-teal-300" : "text-zinc-100"}`}>
          {value}
        </p>
        {sublabel && <p className="mt-1 text-[11px] text-zinc-600">{sublabel}</p>}
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent ? "bg-teal-400/10" : "bg-zinc-800"}`}>
        <Icon className={`h-4 w-4 ${accent ? "text-teal-300" : "text-zinc-400"}`} />
      </div>
    </div>
  );
}

// NOTE: the backend doesn't track per-material stock levels yet — only
// which materials a printer supports (PrinterProfile.materialsSupported).
// This shows the real supported list instead of faking stock percentages.
function MaterialInventoryCard({ materials = [] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Materials Supported</p>
        <Layers className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {materials.length > 0 ? (
          materials.map((m) => (
            <span
              key={m}
              className="rounded-md bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-300"
            >
              {m}
            </span>
          ))
        ) : (
          <p className="text-xs text-zinc-600">None set — add materials in your printer profile</p>
        )}
      </div>
    </div>
  );
}

function MetricsBar({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Briefcase} label="Active Jobs" value={stats.activeCount} accent sublabel="In progress now" />
      <StatCard
        icon={DollarSign}
        label="Total Earnings"
        value={`$${stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        sublabel="From paid, completed jobs"
      />
      <StatCard icon={CheckCircle2} label="Completed Prints" value={stats.completedCount} sublabel="Fulfilled orders" />
      <MaterialInventoryCard materials={stats.materials} />
    </div>
  );
}

/* ----------------------------------------------------------------------
 * INCOMING ORDERS QUEUE
 * -------------------------------------------------------------------- */

function IncomingOrderRow({ order, onAccept, onDecline, busy }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4 border-b border-zinc-800 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <MiniModelThumb seed={seedFromId(order.id)} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">{order.modelTitle}</p>
          <p className="text-xs text-zinc-500">
            for <span className="text-zinc-400">{order.buyer}</span> · qty {order.quantity}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
            {order.distanceLabel && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-teal-400" />
                {order.distanceLabel}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Box className="h-3 w-3" />
              {order.material}
            </span>
            {order.aiPrintTime && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-teal-400" />
                Est. <span className="font-mono text-zinc-400">{order.aiPrintTime}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="font-mono text-sm font-semibold text-teal-300">
          {order.payout != null ? `$${order.payout.toFixed(2)}` : "Payout pending"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onDecline(order.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </button>
          <button
            onClick={() => onAccept(order.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-md bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-300 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Accept Order
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function IncomingOrdersQueue({ orders, onAccept, onDecline, busyId }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-zinc-100">Incoming Orders</h2>
        <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
          {orders.length} pending
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {orders.length > 0 ? (
          orders.map((order) => (
            <IncomingOrderRow
              key={order.id}
              order={order}
              onAccept={onAccept}
              onDecline={onDecline}
              busy={busyId === order.id}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <PackageCheck className="h-6 w-6 text-zinc-600" />
            <p className="text-sm text-zinc-500">No incoming orders right now</p>
            <p className="text-xs text-zinc-600">New requests will appear here as buyers find your fleet</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------------------------------
 * ACTIVE PRINTING STEPPER
 * -------------------------------------------------------------------- */

function StageStepper({ stageIndex }) {
  return (
    <div className="flex items-center">
      {STEPPER_STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isComplete = i < stageIndex;
        const isCurrent = i === stageIndex;

        return (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.08 : 1 }}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete
                    ? "border-teal-400 bg-teal-400 text-zinc-950"
                    : isCurrent
                    ? "border-teal-400 bg-teal-400/10 text-teal-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-600"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </motion.div>
              <span
                className={`max-w-[80px] text-center text-[10px] leading-tight ${
                  isCurrent ? "font-medium text-teal-300" : isComplete ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {stage.label}
              </span>
            </div>

            {i < STEPPER_STAGES.length - 1 && (
              <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-800 sm:mx-2">
                <motion.div
                  initial={false}
                  animate={{ width: i < stageIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-y-0 left-0 bg-teal-400"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ActiveJobCard({ job, onAdvance, busy }) {
  // Active jobs only ever sit at stageIndex 0 (accepted) or 1 (printing) —
  // once "complete" fires the job leaves this list entirely (order moves to
  // SHIPPED), so there's no lingering "final stage" state to render here.
  const nextStage = STEPPER_STAGES[job.stageIndex + 1];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MiniModelThumb seed={seedFromId(job.id)} />
          <div>
            <p className="text-sm font-medium text-zinc-100">{job.modelTitle}</p>
            <p className="text-xs text-zinc-500">
              for <span className="text-zinc-400">{job.buyer}</span> · {job.material} ·{" "}
              <span className="font-mono text-zinc-600">{job.orderId?.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        {nextStage ? (
          <button
            onClick={() => onAdvance(job.id, job.stageIndex)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-300 disabled:opacity-50"
          >
            Mark as {nextStage.label}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-md bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-300 ring-1 ring-inset ring-teal-400/30">
            <Truck className="h-3.5 w-3.5" />
            Awaiting handoff
          </span>
        )}
      </div>

      <div className="mt-5">
        <StageStepper stageIndex={job.stageIndex} />
      </div>
    </div>
  );
}

function ActivePrintingSection({ jobs, onAdvance, busyId }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-zinc-100">Active Printing</h2>
        <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
          {jobs.length} in progress
        </span>
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-4 p-5">
          {jobs.map((job) => (
            <ActiveJobCard key={job.id} job={job} onAdvance={onAdvance} busy={busyId === job.id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <Printer className="h-6 w-6 text-zinc-600" />
          <p className="text-sm text-zinc-500">No active print jobs</p>
          <p className="text-xs text-zinc-600">Accept an incoming order to start tracking it here</p>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
 * PAGE ROOT
 * -------------------------------------------------------------------- */

export default function PolyHubPrinterDashboard() {
  const { user } = useAuth();
  const {
    profile,
    incomingJobs,
    activeJobs,
    loading,
    error,
    actionError,
    accept,
    decline,
    start,
    complete,
    stats: rawStats,
  } = usePrinterDashboard(user);

  // NOTE: PrinterProfile has no `isAvailable` field on the backend yet, so
  // this toggle is local-only for now — it doesn't affect matching. Add a
  // boolean column + wire it into MatchingService.findCandidates if you
  // want this to actually gate order routing.
  const [online, setOnline] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const stats = useMemo(
    () => ({ ...rawStats, materials: profile?.materialsSupported || [] }),
    [rawStats, profile]
  );

  const handleAccept = async (jobId) => {
    setBusyId(jobId);
    try {
      await accept(jobId);
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (jobId) => {
    setBusyId(jobId);
    try {
      await decline(jobId);
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvance = async (jobId, currentStageIndex) => {
    setBusyId(jobId);
    try {
      if (currentStageIndex === 0) await start(jobId);
      else await complete(jobId);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading your dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-950 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-zinc-300">Couldn't load your printer dashboard</p>
        <p className="text-xs text-zinc-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 font-sans text-zinc-100 antialiased sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Printer Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage incoming orders and track jobs across your printer fleet
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-mono text-teal-300">{activeJobs.length}</span> jobs currently printing
          </span>
        </div>

        <AvailabilityToggle online={online} onToggle={() => setOnline((p) => !p)} />

        {!online && (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            You're currently offline — new orders won't be routed to you, but existing active jobs still need to be completed below.
          </div>
        )}

        {actionError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        )}

        <MetricsBar stats={stats} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <IncomingOrdersQueue
            orders={incomingJobs}
            onAccept={handleAccept}
            onDecline={handleDecline}
            busyId={busyId}
          />
          <ActivePrintingSection jobs={activeJobs} onAdvance={handleAdvance} busyId={busyId} />
        </div>
      </div>
    </div>
  );
}