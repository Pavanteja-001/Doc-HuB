// frontend/src/api.js — FINAL PRODUCTION URL
import axios from "axios";

const API = axios.create({
  baseURL: "https://doc-hub-l8f7.onrender.com", // ← YOUR LIVE RENDER URL
  withCredentials: true,
  timeout: 60000, // Handle Render cold starts
});

export default API;
