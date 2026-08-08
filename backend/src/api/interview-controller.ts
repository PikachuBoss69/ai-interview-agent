import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { InterviewEngine } from "../interview/engine";
import { InMemorySessionStore } from "../interview/session-store";
import type { Candidate, InterviewTurn } from "../interview/types";

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface InterviewRequestBody {
  sessionId?: unknown;
  candidate?: unknown;
  message?: unknown;
}

interface FeedbackPayload {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

export function createInterviewRouter(engine?: InterviewEngine) {
  const router = Router();
  const interviewEngine = engine ?? new InterviewEngine(new InMemorySessionStore());

  router.post("/api/interview", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as InterviewRequestBody | undefined;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new HttpError(400, "request body must be an object");
      }

      const hasCandidate = Object.prototype.hasOwnProperty.call(payload, "candidate");
      const hasMessage = Object.prototype.hasOwnProperty.call(payload, "message");

      if (hasCandidate && hasMessage) {
        throw new HttpError(400, "request must include either candidate or message, not both");
      }

      if (!hasCandidate && !hasMessage) {
        throw new HttpError(400, "request must include either candidate or message");
      }

      const sessionId = payload.sessionId;
      if (typeof sessionId !== "string" || !sessionId.trim()) {
        throw new HttpError(400, "sessionId must be a non-empty string");
      }

      if (hasCandidate) {
        const candidate = payload.candidate;
        if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
          throw new HttpError(400, "candidate must be an object");
        }

        const turn = await interviewEngine.start(candidate as Candidate, sessionId.trim());
        res.json({
          reply: turn.question?.text ?? "Interview started.",
          done: false,
        });
        return;
      }

      const message = payload.message;
      if (typeof message !== "string") {
        throw new HttpError(400, "message must be a string");
      }

      const turn = await interviewEngine.processAnswer(sessionId.trim(), message);
      if (turn.decision?.action === "FINISH") {
        res.json({
          reply: "Interview completed.",
          done: true,
          feedback: buildPlaceholderFeedback(turn),
        });
        return;
      }

      res.json({
        reply: turn.question?.text ?? "Interview continued.",
        done: false,
      });
    } catch (error) {
      next(mapInterviewError(error));
    }
  });

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    if (error instanceof Error) {
      res.status(500).json({ error: "internal server error" });
      return;
    }

    res.status(500).json({ error: "internal server error" });
  });

  return router;
}

function mapInterviewError(error: unknown): Error {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("already exists")) {
      return new HttpError(400, "session already exists");
    }
    if (message.includes("does not exist") || message.includes("not found")) {
      return new HttpError(404, "session not found");
    }
    if (message.includes("already completed")) {
      return new HttpError(409, "session already completed");
    }
    if (message.includes("must be a non-empty string") || message.includes("must be an object") || message.includes("must be a string")) {
      return new HttpError(400, message);
    }
    return new HttpError(500, "internal server error");
  }

  return new HttpError(500, "internal server error");
}

function buildPlaceholderFeedback(turn: InterviewTurn): FeedbackPayload {
  const answerCount = turn.answer ? 1 : 0;
  return {
    summary: `Placeholder feedback: interview completed after ${answerCount} answered turn.`,
    strengths: ["Placeholder: the interview captured structured evidence."],
    gaps: ["Placeholder: detailed feedback will be added later."],
    next: ["Placeholder: continue improving the interview engine."],
  };
}
