// frontend/src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://doc-hub-l8f7.onrender.com",
  withCredentials: true,
});

export default API;
