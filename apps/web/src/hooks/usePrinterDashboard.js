import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// Haversine distance in km — mirrors MatchingService on the backend so the
// dashboard can show "X km away" without a dedicated endpoint for it.
function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatMinutes(min) {
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function shapeJob(job, profile) {
  const order = job.order;
  const addr = order?.shippingAddress || {};
  const km = distanceKm(profile?.latitude, profile?.longitude, addr.latitude, addr.longitude);

  return {
    id: job.id,
    orderId: order?.id,
    modelTitle: order?.model?.title || "Untitled model",
    buyer: order?.buyer?.name || "Buyer",
    material: order?.variant?.material || "—",
    quantity: order?.quantity ?? 1,
    distanceLabel: km != null ? `${km.toFixed(1)} km away` : null,
    aiPrintTime: formatMinutes(order?.estimatedPrintTimeMin),
    // Payout only exists once a Payment row has been created for the order.
    // Before that (or if it hasn't been marked PAID yet) we're honest that
    // it isn't settled rather than inventing a number.
    payout:
      order?.payment?.status === "PAID" ? Number(order.payment.printerPayout) : null,
    acceptedAt: job.acceptedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    failureReason: job.failureReason,
    // 0 = accepted/not started, 1 = printing, 2 = shipped — matches the
    // three real transitions the backend supports (accept/start/complete).
    stageIndex: job.completedAt ? 2 : job.startedAt ? 1 : 0,
  };
}

export function usePrinterDashboard(user) {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [myProfile, myJobs] = await Promise.all([
        api.get("/printers/me"),
        api.get("/printers/me/jobs"),
      ]);
      setProfile(myProfile);
      setJobs(myJobs.map((j) => shapeJob(j, myProfile)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runAction(jobId, action) {
    setActionError(null);
    try {
      await api.post(`/printers/me/jobs/${jobId}/status`, { action });
      await refresh();
    } catch (err) {
      setActionError(err.message);
      throw err;
    }
  }

  const incomingJobs = jobs.filter((j) => !j.acceptedAt);
  const activeJobs = jobs.filter((j) => j.acceptedAt && !j.completedAt && !j.failureReason);
  const completedJobs = jobs.filter((j) => j.completedAt);

  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.payout || 0), 0);

  return {
    profile,
    incomingJobs,
    activeJobs,
    completedJobs,
    loading,
    error,
    actionError,
    refresh,
    updateProfile: async (patch) => {
      const updated = await api.patch("/printers/me", patch);
      setProfile(updated);
      return updated;
    },
    accept: (jobId) => runAction(jobId, "accept"),
    decline: (jobId) => runAction(jobId, "decline"),
    start: (jobId) => runAction(jobId, "start"),
    complete: (jobId) => runAction(jobId, "complete"),
    fail: (jobId) => runAction(jobId, "fail"),
    stats: {
      activeCount: activeJobs.length,
      completedCount: completedJobs.length,
      totalEarnings,
    },
  };
}