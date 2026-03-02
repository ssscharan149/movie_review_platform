import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

function isAuthEndpoint(url = "") {
  return url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");
}

function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("name");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  window.dispatchEvent(new Event("auth:forced-logout"));
}

async function refreshTokens() {
  const currentRefreshToken = localStorage.getItem("refreshToken");
  if (!currentRefreshToken) {
    throw new Error("No refresh token available");
  }

  const { data } = await refreshClient.post("/auth/refresh", { refreshToken: currentRefreshToken });
  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("name", data.name);
  localStorage.setItem("role", data.role);
  localStorage.setItem("userId", String(data.userId));
  window.dispatchEvent(new Event("auth:token-refreshed"));
  return data.token;
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";
    const shouldTryRefresh =
      (status === 401 || status === 403) &&
      !originalRequest?._retry &&
      !isAuthEndpoint(requestUrl) &&
      Boolean(localStorage.getItem("refreshToken"));

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ||= refreshTokens();
      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return client(originalRequest);
    } catch (refreshError) {
      const role = localStorage.getItem("role");
      clearAuthStorage();
      if (role === "ADMIN") {
        window.location.assign("/login");
      }
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default client;
