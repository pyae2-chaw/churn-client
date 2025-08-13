import axios from "axios";

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL, // no trailing slash
  // withCredentials: false  // keep false unless you actually set cookies from ML
});

export default mlApi;
