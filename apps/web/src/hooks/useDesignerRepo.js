import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export function useDesignerRepo(user) {
  const [models, setModels] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [starredModels, setStarredModels] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [myModels, myFollowers, myStars, myIncoming] = await Promise.all([
        api.get("/catalog/my-models"),
        api.get(`/designers/${user.id}/followers`),
        api.get("/me/stars"),
        api.get("/me/license-requests/incoming"),
      ]);
      setModels(myModels);
      setFollowers(myFollowers);
      setStarredModels(myStars);
      setIncomingRequests(myIncoming);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function uploadModel({ file, title, description, category, priceBase, licenseType, tags }) {
    const fileFormat = file.name.split(".").pop().toLowerCase();
    const contentType = fileFormat === "glb" ? "model/gltf-binary" : "application/octet-stream";

    // Server now enforces a real 200MB cap (baked into the S3 signature
    // itself), so a file this large would fail the upload-url request —
    // catching it here first gives a clear message instead of a generic
    // network/validation error partway through.
    const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB) — the maximum is 200MB.`
      );
    }

    const { uploadUrl, key } = await api.post("/catalog/upload-url", {
      filename: file.name,
      contentType,
      fileSize: file.size,
    });

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });

    const model = await api.post("/catalog/models", {
      title,
      description,
      category,
      priceBase: Number(priceBase),
      licenseType,
      fileFormat,
      originalFilename: file.name,
      tags: tags || [],
      key,
    });

    await api.post(`/catalog/models/${model.id}/publish`);
    await refresh();
    return model;
  }

  async function respondToLicenseRequest(grantId, action) {
    await api.post(`/license-grants/${grantId}/respond`, { action });
    await refresh();
  }

  async function updateModel(modelId, patch) {
    const updated = await api.patch(`/catalog/models/${modelId}`, patch);
    await refresh();
    return updated;
  }

  async function deleteModel(modelId, password) {
    const result = await api.del(`/catalog/models/${modelId}`, { password });
    await refresh();
    return result;
  }

  return {
    models,
    followers,
    starredModels,
    incomingRequests,
    loading,
    error,
    refresh,
    uploadModel,
    respondToLicenseRequest,
    updateModel,
    deleteModel,
  };
}