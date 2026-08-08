import { DevelopmentAnswerEvaluator } from "../src/interview/evaluator";
import { Candidate, GeneratedQuestion, InterviewStage, InterviewState, Message } from "../src/interview/types";

function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function makeState(): InterviewState {
  return {
    sessionId: "session-1",
    candidate: { id: "cand-1" } as Candidate,
    questionCount: 1,
    stage: InterviewStage.Establish,
    evidence: [],
    uncertainties: [],
    investigations: [],
    coveredTopics: [],
    coveredCurriculumDays: [1],
    askedQuestions: ["q-1"],
    messages: [],
    turns: [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeQuestion(): GeneratedQuestion {
  return {
    id: "q-1",
    text: "Describe how you would debug a failing deployment.",
    targetArea: "debugging",
    curriculumDays: [2],
    purpose: "test evaluator",
    createdAt: new Date().toISOString(),
  };
}

async function run() {
  const evaluator = new DevelopmentAnswerEvaluator();
  const state = makeState();
  const question = makeQuestion();
  const candidate: Candidate = { id: "cand-1", displayName: "Ada" };

  const meaningfulAnswer: Message = {
    id: "msg-meaningful",
    role: "candidate",
    content: "I would first reproduce the error, inspect logs, isolate the failing component, and then implement a fix while considering latency and deployment tradeoffs.",
    createdAt: new Date().toISOString(),
    questionId: question.id,
  };

  const evaluation = await evaluator.evaluate({ candidate, state, question, answer: meaningfulAnswer });
  assert(evaluation.evidence.length === 1, "sufficiently detailed answer should yield one generic evidence item");
  assert(evaluation.confidence === "medium", "sufficiently detailed answer should have medium confidence");
  assert(evaluation.missing.length === 0, "sufficiently detailed answer should not report missing evidence");
  assert(Object.keys(evaluation.evidence[0].competencies).length === 0, "substantive answer should not infer specific competencies");

  const emptyAnswer: Message = {
    id: "msg-empty",
    role: "candidate",
    content: "  ",
    createdAt: new Date().toISOString(),
    questionId: question.id,
  };

  const emptyEvaluation = await evaluator.evaluate({ candidate, state, question, answer: emptyAnswer });
  assert(emptyEvaluation.evidence.length === 0, "empty answer should yield no evidence");
  assert(emptyEvaluation.missing.includes("A candidate answer was not provided."), "empty answer should include a missing-data message");

  const shortAnswer: Message = {
    id: "msg-short",
    role: "candidate",
    content: "I think so.",
    createdAt: new Date().toISOString(),
    questionId: question.id,
  };

  const shortEvaluation = await evaluator.evaluate({ candidate, state, question, answer: shortAnswer });
  assert(shortEvaluation.evidence.length === 1, "very short answer should produce weak evidence");
  assert(shortEvaluation.confidence === "low", "short answer should have low confidence");
  assert(
    shortEvaluation.evidence[0].observations.some((obs) => obs.includes("very short")),
    "short answer should indicate insufficient detail"
  );

  const keywordAnswer: Message = {
    id: "msg-keywords",
    role: "candidate",
    content: "I don't know how to debug this. Security and latency concerns are important and I would deploy the fix later.",
    createdAt: new Date().toISOString(),
    questionId: question.id,
  };

  const keywordEvaluation = await evaluator.evaluate({ candidate, state, question, answer: keywordAnswer });
  assert(keywordEvaluation.evidence.length === 1, "keyword-heavy answer should still yield generic evidence only");
  assert(
    keywordEvaluation.evidence[0].competencies.debugging === undefined,
    "keyword-heavy answer should not infer debugging competency"
  );
  assert(
    keywordEvaluation.evidence[0].competencies.optimization === undefined,
    "keyword-heavy answer should not infer optimization competency"
  );
  assert(
    keywordEvaluation.evidence[0].competencies.security === undefined,
    "keyword-heavy answer should not infer security competency"
  );

  const originalStateSnapshot = JSON.stringify(state);
  await evaluator.evaluate({ candidate, state, question, answer: meaningfulAnswer });
  assert(JSON.stringify(state) === originalStateSnapshot, "evaluator must not mutate interview state");

  console.log("All evaluator tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
