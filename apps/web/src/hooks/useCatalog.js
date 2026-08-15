import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

// Shared across Buyer-facing pages (BuyerHome, SearchResults, model detail)
// so we don't duplicate fetch/loading/error logic in each component.
export function useLiveModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    return api
      .get("/catalog/models")
      .then(setModels)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { models, loading, error, refresh };
}

export function useModel(modelId) {
  const [model, setModel] = useState(null);
  const [viewUrl, setViewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!modelId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/catalog/models/${modelId}`),
      api.get(`/catalog/models/${modelId}/view-url`),
    ])
      .then(([modelData, urlData]) => {
        setModel(modelData);
        setViewUrl(urlData.url);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [modelId]);

  return { model, viewUrl, loading, error };
}