import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export function useAdminDashboard() {
  const [models, setModels] = useState([]);
  const [disputedOrders, setDisputedOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flaggingId, setFlaggingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelsRes, disputedRes, usersRes] = await Promise.all([
        api.get("/admin/models"),
        api.get("/admin/orders/disputed"),
        api.get("/admin/users"),
      ]);
      setModels(modelsRes);
      setDisputedOrders(disputedRes);
      setUsers(usersRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function setModelFlag(modelId, action) {
    setFlaggingId(modelId);
    setActionError(null);
    try {
      await api.patch(`/admin/models/${modelId}/flag`, { action });
      await refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setFlaggingId(null);
    }
  }

  return {
    models,
    disputedOrders,
    users,
    loading,
    error,
    actionError,
    flaggingId,
    flagModel: (id) => setModelFlag(id, "flag"),
    unflagModel: (id) => setModelFlag(id, "unflag"),
  };
}