import assert from "assert";
import http from "http";
import type { AddressInfo } from "net";
import { createApp } from "../src/app";
import type { Candidate, InterviewTurn } from "../src/interview/types";

function createJsonRequest(app: ReturnType<typeof createApp>, body: unknown) {
  return new Promise<{ statusCode: number; body: any }>((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1");
    server.once("listening", () => {
      const address = server.address() as AddressInfo;
      const request = http.request(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path: "/api/interview",
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        },
        (response) => {
          let data = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            server.close(() => {
              try {
                const parsed = data ? JSON.parse(data) : undefined;
                resolve({ statusCode: response.statusCode ?? 0, body: parsed });
              } catch (error) {
                reject(error);
              }
            });
          });
        }
      );

      request.on("error", (error) => {
        server.close(() => reject(error));
      });

      request.write(JSON.stringify(body));
      request.end();
    });
  });
}

class StubInterviewEngine {
  public startCalls = 0;
  public processCalls = 0;
  public lastCandidate?: Candidate;
  public lastMessage?: string;

  async start(candidate: Candidate, sessionId: string): Promise<InterviewTurn> {
    this.startCalls += 1;
    this.lastCandidate = candidate;
    return {
      turnNumber: 1,
      question: {
        id: `${sessionId}-question-1`,
        text: "First question",
        targetArea: "Establish",
        curriculumDays: [1],
        purpose: "test",
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async processAnswer(sessionId: string, message: string): Promise<InterviewTurn> {
    this.processCalls += 1;
    this.lastMessage = message;
    return {
      turnNumber: 2,
      question: {
        id: `${sessionId}-question-2`,
        text: "Next question",
        targetArea: "Build",
        curriculumDays: [2],
        purpose: "test",
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

class FinishingStubEngine extends StubInterviewEngine {
  async processAnswer(sessionId: string, message: string): Promise<InterviewTurn> {
    this.processCalls += 1;
    this.lastMessage = message;
    return {
      turnNumber: 2,
      question: {
        id: `${sessionId}-question-2`,
        text: "Final question",
        targetArea: "Build",
        curriculumDays: [2],
        purpose: "test",
        createdAt: new Date().toISOString(),
      },
      answer: {
        id: `${sessionId}-answer-1`,
        role: "candidate",
        content: message,
        createdAt: new Date().toISOString(),
        questionId: `${sessionId}-question-1`,
      },
      evaluation: {
        evaluationId: `${sessionId}-evaluation-1`,
        evidence: [],
        missing: [],
        contradictions: [],
        confidence: "medium",
        evaluatedAt: new Date().toISOString(),
      },
      decision: { action: "FINISH" },
      timestamp: new Date().toISOString(),
    };
  }
}

class ErroringStubEngine extends StubInterviewEngine {
  async processAnswer(_sessionId: string, _message: string): Promise<InterviewTurn> {
    throw new Error("session not found");
  }
}

class InternalErrorStubEngine extends StubInterviewEngine {
  async processAnswer(_sessionId: string, _message: string): Promise<InterviewTurn> {
    throw new Error("boom");
  }
}

async function run() {
  const startEngine = new StubInterviewEngine();
  const startResponse = await createJsonRequest(createApp(startEngine as any), {
    sessionId: "abc-123",
    candidate: { displayName: "Ada" },
  });
  assert.strictEqual(startResponse.statusCode, 200);
  assert.strictEqual(startResponse.body.done, false);
  assert.strictEqual(startResponse.body.reply, "First question");
  assert.strictEqual(startEngine.startCalls, 1);
  assert.strictEqual(startEngine.lastCandidate?.displayName, "Ada");
  assert.strictEqual(startResponse.body.questionCount, undefined);
  assert.strictEqual(startResponse.body.turns, undefined);

  const continuationEngine = new StubInterviewEngine();
  const continuationResponse = await createJsonRequest(createApp(continuationEngine as any), {
    sessionId: "abc-123",
    message: "I can explain my approach.",
  });
  assert.strictEqual(continuationResponse.statusCode, 200);
  assert.strictEqual(continuationResponse.body.done, false);
  assert.strictEqual(continuationResponse.body.reply, "Next question");
  assert.strictEqual(continuationEngine.processCalls, 1);
  assert.strictEqual(continuationEngine.lastMessage, "I can explain my approach.");

  const completedEngine = new FinishingStubEngine();
  const completedResponse = await createJsonRequest(createApp(completedEngine as any), {
    sessionId: "abc-123",
    message: "I can explain my approach.",
  });
  assert.strictEqual(completedResponse.statusCode, 200);
  assert.strictEqual(completedResponse.body.done, true);
  assert.strictEqual(completedResponse.body.reply, "Interview completed.");
  assert.deepStrictEqual(completedResponse.body.feedback, {
    summary: "Placeholder feedback: interview completed after 1 answered turn.",
    strengths: ["Placeholder: the interview captured structured evidence."],
    gaps: ["Placeholder: detailed feedback will be added later."],
    next: ["Placeholder: continue improving the interview engine."],
  });

  const missingSessionIdResponse = await createJsonRequest(createApp(new StubInterviewEngine() as any), {
    candidate: { displayName: "Ada" },
  });
  assert.strictEqual(missingSessionIdResponse.statusCode, 400);
  assert.strictEqual(missingSessionIdResponse.body.error, "sessionId must be a non-empty string");

  const missingCandidateResponse = await createJsonRequest(createApp(new StubInterviewEngine() as any), {
    sessionId: "abc-123",
  });
  assert.strictEqual(missingCandidateResponse.statusCode, 400);
  assert.strictEqual(missingCandidateResponse.body.error, "request must include either candidate or message");

  const invalidMessageResponse = await createJsonRequest(createApp(new StubInterviewEngine() as any), {
    sessionId: "abc-123",
    message: 42,
  });
  assert.strictEqual(invalidMessageResponse.statusCode, 400);
  assert.strictEqual(invalidMessageResponse.body.error, "message must be a string");

  const malformedResponse = await createJsonRequest(createApp(new StubInterviewEngine() as any), ["not", "an", "object"] as unknown as object);
  assert.strictEqual(malformedResponse.statusCode, 400);
  assert.strictEqual(malformedResponse.body.error, "request body must be an object");

  const missingSessionEngine = new ErroringStubEngine();
  const missingSessionResponse = await createJsonRequest(createApp(missingSessionEngine as any), {
    sessionId: "missing",
    message: "hello",
  });
  assert.strictEqual(missingSessionResponse.statusCode, 404);
  assert.strictEqual(missingSessionResponse.body.error, "session not found");

  const internalErrorEngine = new InternalErrorStubEngine();
  const internalErrorResponse = await createJsonRequest(createApp(internalErrorEngine as any), {
    sessionId: "missing",
    message: "hello",
  });
  assert.strictEqual(internalErrorResponse.statusCode, 500);
  assert.strictEqual(internalErrorResponse.body.error, "internal server error");
  assert.strictEqual(internalErrorResponse.body.stack, undefined);

  console.log("All API tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
