import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true,
  timeout: 90000,
});

export default API;
