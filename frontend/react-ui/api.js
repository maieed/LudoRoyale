import axios from "axios";

const normalizeApiBase = (url) => {
  const cleaned = String(url || "").trim().replace(/\/+$/, "");
  if (!cleaned) return "http://localhost:4000/api";
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
};

const apiBase = normalizeApiBase(import.meta.env.VITE_API_URL || "http://localhost:4000");

export const api = axios.create({
  baseURL: apiBase
});

export const setHeaders = (userId, adminKey) => {
  api.defaults.headers.common["x-user-id"] = userId;
  if (adminKey) {
    api.defaults.headers.common["x-admin-key"] = adminKey;
  } else {
    delete api.defaults.headers.common["x-admin-key"];
  }
};