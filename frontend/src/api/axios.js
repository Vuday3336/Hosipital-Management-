import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

// Falls back to the deployed Render API so the Vercel build works out of the
// box even without VITE_API_URL set in the Vercel dashboard; local dev
// overrides this via frontend/.env.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://meridian-health-api.onrender.com/api",
  withCredentials: true, // send the httpOnly refresh-token cookie
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthRoute = config?.url?.includes("/auth/login") || config?.url?.includes("/auth/refresh");

    if (response?.status === 401 && !config._retry && !isAuthRoute) {
      config._retry = true;
      try {
        refreshPromise ??= api.post("/auth/refresh").finally(() => {
          refreshPromise = null;
        });
        const { data } = await refreshPromise;
        useAuthStore.getState().setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        useAuthStore.getState().clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const unwrap = (promise) => promise.then((res) => res.data);
