import { api, unwrap } from "./axios.js";

export const registerRequest = (payload) => unwrap(api.post("/auth/register", payload));
export const loginRequest = (payload) => unwrap(api.post("/auth/login", payload));
export const logoutRequest = () => unwrap(api.post("/auth/logout"));
export const refreshRequest = () => unwrap(api.post("/auth/refresh"));
export const meRequest = () => unwrap(api.get("/auth/me"));
export const forgotPasswordRequest = (payload) => unwrap(api.post("/auth/forgot-password", payload));
export const resetPasswordRequest = (payload) => unwrap(api.post("/auth/reset-password", payload));
export const changePasswordRequest = (payload) => unwrap(api.post("/auth/change-password", payload));
