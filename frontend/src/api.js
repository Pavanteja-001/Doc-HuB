// frontend/src/api.js — FINAL WORKING VERSION
import axios from "axios";

const API = axios.create({
  baseURL: "https://doc-hub-l8f7.onrender.com", // ← YOUR LIVE BACKEND
  withCredentials: true,
  timeout: 90000,
});

export default API;
