import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Check,
  X,
  ChevronRight,
  Printer,
  PackageCheck,
  Scissors,
  ClipboardCheck,
  Truck,
  AlertCircle,
  Box,
  TrendingUp,
} from "lucide-react";

/* ----------------------------------------------------------------------
 * MOCK DATA
 * -------------------------------------------------------------------- */

const METRICS = {
  activeJobs: 3,
  totalEarnings: 1284.5,
  completedPrints: 96,
  materials: [
    { name: "PLA", level: 78 },
    { name: "PETG", level: 34 },
    { name: "Resin", level: 12 },
  ],
};

const INCOMING_ORDERS = [
  {
    id: "ord-7741",
    modelTitle: "Minimalist Headphone Stand",
    buyer: "studio.northwind",
    distance: "2.4 miles away",
    material: "PLA",
    quantity: 1,
    aiPrintTime: "3h 10m",
    payout: 12.5,
    seed: 3,
  },
  {
    id: "ord-7742",
    modelTitle: "Articulated Robotic Hand v3",
    buyer: "robo_hobbyist_22",
    distance: "5.1 miles away",
    material: "PETG",
    quantity: 1,
    aiPrintTime: "14h 30m",
    payout: 38.0,
    seed: 2,
  },
  {
    id: "ord-7743",
    modelTitle: "Modular Cable Tray System",
    buyer: "voidframe_fan",
    distance: "0.8 miles away",
    material: "ABS",
    quantity: 2,
    aiPrintTime: "5h 45m",
    payout: 19.0,
    seed: 4,
  },
];

const STEPPER_STAGES = [
  { id: "accepted", label: "Accepted", icon: ClipboardCheck },
  { id: "slicing", label: "Slicing", icon: Scissors },
  { id: "printing", label: "Printing", icon: Printer },
  { id: "ready", label: "Ready for Pickup/Shipping", icon: PackageCheck },
];

const INITIAL_ACTIVE_JOBS = [
  {
    id: "ord-7699",
    modelTitle: "Geared Planetary Fidget",
    buyer: "axiom.makes",
    material: "PLA",
    stageIndex: 1, // Slicing
  },
  {
    id: "ord-7705",
    modelTitle: "Lattice Vase — Parametric Set",
    buyer: "plant_lady_eve",
    material: "Resin",
    stageIndex: 2, // Printing
  },
];

/* ----------------------------------------------------------------------
 * SMALL SIMULATED MODEL THUMBNAIL (reused visual language from earlier
 * pages, scaled down — gives orders a sense of "what am I printing")
 * -------------------------------------------------------------------- */

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

function MaterialInventoryCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Material Inventory</p>
        <Layers className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="mt-3 space-y-2.5">
        {METRICS.materials.map((m) => (
          <div key={m.name}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-mono text-zinc-400">{m.name}</span>
              <span className={`font-mono ${m.level < 20 ? "text-amber-400" : "text-zinc-500"}`}>
                {m.level}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${m.level < 20 ? "bg-amber-400" : "bg-teal-400"}`}
                style={{ width: `${m.level}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsBar() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Briefcase} label="Active Jobs" value={METRICS.activeJobs} accent sublabel="In progress now" />
      <StatCard
        icon={DollarSign}
        label="Total Earnings"
        value={`$${METRICS.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        sublabel="All-time"
      />
      <StatCard icon={CheckCircle2} label="Completed Prints" value={METRICS.completedPrints} sublabel="Fulfilled orders" />
      <MaterialInventoryCard />
    </div>
  );
}

/* ----------------------------------------------------------------------
 * INCOMING ORDERS QUEUE
 * -------------------------------------------------------------------- */

function IncomingOrderRow({ order, onAccept, onDecline }) {
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
        <MiniModelThumb seed={order.seed} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">{order.modelTitle}</p>
          <p className="text-xs text-zinc-500">
            for <span className="text-zinc-400">{order.buyer}</span> · qty {order.quantity}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-teal-400" />
              {order.distance}
            </span>
            <span className="flex items-center gap-1">
              <Box className="h-3 w-3" />
              {order.material}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-teal-400" />
              AI est. <span className="font-mono text-zinc-400">{order.aiPrintTime}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="font-mono text-sm font-semibold text-teal-300">${order.payout.toFixed(2)}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onDecline(order.id)}
            className="flex items-center gap-1 rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </button>
          <button
            onClick={() => onAccept(order.id)}
            className="flex items-center gap-1 rounded-md bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-300"
          >
            <Check className="h-3.5 w-3.5" />
            Accept Order
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function IncomingOrdersQueue({ orders, onAccept, onDecline }) {
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
            <IncomingOrderRow key={order.id} order={order} onAccept={onAccept} onDecline={onDecline} />
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

function ActiveJobCard({ job, onAdvance }) {
  const isFinalStage = job.stageIndex >= STEPPER_STAGES.length - 1;
  const nextStage = STEPPER_STAGES[job.stageIndex + 1];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MiniModelThumb seed={(job.stageIndex + 5) % 9 || 1} />
          <div>
            <p className="text-sm font-medium text-zinc-100">{job.modelTitle}</p>
            <p className="text-xs text-zinc-500">
              for <span className="text-zinc-400">{job.buyer}</span> · {job.material} ·{" "}
              <span className="font-mono text-zinc-600">{job.id}</span>
            </p>
          </div>
        </div>

        {!isFinalStage ? (
          <button
            onClick={() => onAdvance(job.id)}
            className="flex items-center gap-1.5 rounded-md bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-300"
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

function ActivePrintingSection({ jobs, onAdvance }) {
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
            <ActiveJobCard key={job.id} job={job} onAdvance={onAdvance} />
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
  const [online, setOnline] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(INCOMING_ORDERS);
  const [activeJobs, setActiveJobs] = useState(INITIAL_ACTIVE_JOBS);

  const handleAccept = (orderId) => {
    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;

    setActiveJobs((prev) => [
      ...prev,
      {
        id: order.id,
        modelTitle: order.modelTitle,
        buyer: order.buyer,
        material: order.material,
        stageIndex: 0,
      },
    ]);
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleDecline = (orderId) => {
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleAdvance = (jobId) => {
    setActiveJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, stageIndex: Math.min(job.stageIndex + 1, STEPPER_STAGES.length - 1) }
          : job
      )
    );
  };

  const liveActiveCount = useMemo(
    () => activeJobs.filter((j) => j.stageIndex < STEPPER_STAGES.length - 1).length,
    [activeJobs]
  );

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
            <span className="font-mono text-teal-300">{liveActiveCount}</span> jobs currently printing
          </span>
        </div>

        <AvailabilityToggle online={online} onToggle={() => setOnline((p) => !p)} />

        {!online && (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            You're currently offline — new orders won't be routed to you, but existing active jobs still need to be completed below.
          </div>
        )}

        <MetricsBar />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <IncomingOrdersQueue orders={pendingOrders} onAccept={handleAccept} onDecline={handleDecline} />
          <ActivePrintingSection jobs={activeJobs} onAdvance={handleAdvance} />
        </div>
      </div>
    </div>
  );
}