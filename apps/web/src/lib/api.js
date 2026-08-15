const API_BASE = "http://localhost:4000";

function getAccessToken() {
  return localStorage.getItem("polyhub_access_token");
}

function getRefreshToken() {
  return localStorage.getItem("polyhub_refresh_token");
}

export function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem("polyhub_access_token", accessToken);
  localStorage.setItem("polyhub_refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("polyhub_access_token");
  localStorage.removeItem("polyhub_refresh_token");
}

export function getStoredUser() {
  const raw = localStorage.getItem("polyhub_user");
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
  localStorage.setItem("polyhub_user", JSON.stringify(user));
}

function decodeExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

let refreshPromise = null;

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data);
    setStoredUser(data.user);
    return true;
  } catch {
    return false;
  }
}

async function ensureFreshToken() {
  const token = getAccessToken();
  if (!token) return;

  const isExpiringSoon = decodeExpiry(token) < Date.now() + 5000;
  if (!isExpiringSoon) return;

  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

async function request(path, options = {}) {
  if (path !== "/auth/login" && path !== "/auth/register" && path !== "/auth/refresh") {
    await ensureFreshToken();
  }

  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: "no-store" });

  if (res.status === 401 && path !== "/auth/login" && path !== "/auth/register") {
    clearTokens();
    localStorage.removeItem("polyhub_user");
    window.location.href = "/login";
    throw new Error("Session expired — please log in again");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(", ") : body.message || message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path, body) => request(path, { method: "DELETE", ...(body ? { body: JSON.stringify(body) } : {}) }),
};