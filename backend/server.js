require("dotenv").config();
require("./db");

const express = require("express");
const app = express();

// FIXED CORS FOR VERCEL + RENDER
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "https://doc-hu-b.vercel.app",
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use("/auth", require("./routes/auth"));
app.use("/docs", require("./routes/documents"));

// RENDER REQUIRES DYNAMIC PORT
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`BACKEND LIVE ON PORT ${PORT}`);
  console.log(
    `URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`
  );
});
