require("dotenv").config();
require("./db");

const express = require("express");
const app = express();

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:3000",
    "https://doc-hu-b.vercel.app/"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(express.json());
app.use("/auth", require("./routes/auth"));
app.use("/docs", require("./routes/documents"));

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`BACKEND RUNNING ON http://localhost:${PORT} `);
});
