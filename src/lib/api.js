import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // no trailing slash
  withCredentials: true, // REQUIRED for cookies
});

export default api;
