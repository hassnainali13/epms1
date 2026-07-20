import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("epms_token");
  const headers = { ...(config.headers as Record<string, string> | undefined) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(config.data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  } else {
    delete headers["Content-Type"];
  }

  config.headers = headers as any;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.error || error?.message || "Request failed";
    if (status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem("epms_token");
      localStorage.removeItem("epms_refresh_token");
      try {
        window.location.href = "/login";
      } catch (e) {
        // ignore in non-browser environments
      }
    }
    return Promise.reject(new Error(message));
  },
);

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

export default api;
