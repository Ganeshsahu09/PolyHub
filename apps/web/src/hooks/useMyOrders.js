import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export function useMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get("/orders");
      setOrders(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function cancelOrder(orderId) {
    setCancellingId(orderId);
    setCancelError(null);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      await refresh();
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancellingId(null);
    }
  }

  return { orders, loading, error, refresh, cancelOrder, cancellingId, cancelError };
}