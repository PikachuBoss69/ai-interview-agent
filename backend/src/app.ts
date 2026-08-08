import express, { type Express } from "express";
import { InterviewEngine } from "./interview/engine";
import { createInterviewRouter } from "./api/interview-controller";

export function createApp(engine?: InterviewEngine): Express {
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

  app.use(createInterviewRouter(engine));

  return app;
}

const app = createApp();

export default app;
