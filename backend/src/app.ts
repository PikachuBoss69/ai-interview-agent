import express from "express";

const app = express();

app.use(express.json());

// Health endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Basic root
app.get("/", (_req, res) => {
  res.json({ message: "AI Interview Agent Backend" });
});

export default app;
