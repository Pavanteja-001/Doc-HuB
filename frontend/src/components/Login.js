import React, { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import API from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await API.post(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.error || "Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-96">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Login
        </h2>
        {msg && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-6 text-center">
            {msg}
          </div>
        )}
        <form onSubmit={handleLogin} autoComplete="on" className="space-y-5">
          <input
            id="email"
            name="username"
            autoComplete="username"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            id="password"
            name="password"
            autoComplete="current-password"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          No account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-bold hover:underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
