import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api"
});

export const setHeaders = (userId, adminKey) => {
  api.defaults.headers.common["x-user-id"] = userId;
  if (adminKey) {
    api.defaults.headers.common["x-admin-key"] = adminKey;
  }
};