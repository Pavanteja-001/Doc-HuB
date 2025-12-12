import axios from "axios";

const API = axios.create({
  baseURL: "https://doc-hub-l8f7.onrender.com" || "http://localhost:5000",
  withCredentials: true,
  timeout: 90000,
});

export default API;
