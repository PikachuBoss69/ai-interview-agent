import { DevelopmentDecisionEngine } from "../src/interview/decision";
import { AnswerEvaluation, Candidate, Decision, GeneratedQuestion, InterviewStage, InterviewState } from "../src/interview/types";

function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function makeState(overrides: Partial<InterviewState> = {}): InterviewState {
  return {
    sessionId: "session-1",
    candidate: { id: "cand-1" } as Candidate,
    questionCount: 1,
    stage: InterviewStage.Establish,
    evidence: [],
    uncertainties: [],
    investigations: [],
    coveredTopics: [],
    coveredCurriculumDays: [1, 2, 3],
    askedQuestions: ["q-1"],
    messages: [],
    turns: [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeQuestion(): GeneratedQuestion {
  return {
    id: "q-1",
    text: "Describe your approach.",
    targetArea: "debugging",
    curriculumDays: [1],
    purpose: "test decision engine",
    createdAt: new Date().toISOString(),
  };
}

function makeEvaluation(confidence: "low" | "medium" | "high", evidenceCount: number): AnswerEvaluation {
  return {
    evaluationId: "eval-1",
    evidence: Array.from({ length: evidenceCount }, (_, idx) => ({
      id: `evidence-${idx}`,
      questionId: "q-1",
      topic: "debugging",
      competencies: {},
      observations: ["placeholder"],
      missing: [],
      contradictions: [],
      confidence: "low" as const,
      createdAt: new Date().toISOString(),
    })),
    missing: [],
    contradictions: [],
    confidence,
    evaluatedAt: new Date().toISOString(),
  };
}

async function run() {
  const engine = new DevelopmentDecisionEngine();
  const candidate: Candidate = { id: "cand-1", displayName: "Ada" };
  const question = makeQuestion();

  const earlyState = makeState({ questionCount: 7, coveredCurriculumDays: [1, 2, 3] });
  const earlyDecision = await engine.decide({ candidate, state: earlyState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(earlyDecision.action !== "FINISH", "fewer than 8 questions cannot finish");

  const maxState = makeState({ questionCount: 12, coveredCurriculumDays: [1, 2, 3, 4] });
  const maxDecision = await engine.decide({ candidate, state: maxState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(maxDecision.action === "FINISH", "12 questions must finish");

  const lowCoverageState = makeState({ questionCount: 8, coveredCurriculumDays: [1, 2, 3] });
  const lowCoverageDecision = await engine.decide({ candidate, state: lowCoverageState, question, answerEvaluation: makeEvaluation("high", 1) });
  assert(lowCoverageDecision.action !== "FINISH", "fewer than 4 curriculum days cannot finish");

  const weakState = makeState({ questionCount: 8, coveredCurriculumDays: [1, 2, 3, 4] });
  const weakDecision = await engine.decide({ candidate, state: weakState, question, answerEvaluation: makeEvaluation("low", 0) });
  assert(weakDecision.action === "CONTINUE_INVESTIGATION", "weak/low-confidence evaluation should trigger investigation");
  assert(weakDecision.action === "CONTINUE_INVESTIGATION" && weakDecision.investigation.targetArea === question.targetArea, "investigation target area should follow the current question");

  const normalState = makeState({ questionCount: 8, coveredCurriculumDays: [1, 2, 3, 4] });
  const normalDecision = await engine.decide({ candidate, state: normalState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(normalDecision.action === "ADVANCE_STAGE", "normal continuation should advance stage");

  const originalStateSnapshot = JSON.stringify(normalState);
  await engine.decide({ candidate, state: normalState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(JSON.stringify(normalState) === originalStateSnapshot, "decision engine must not mutate interview state");

  const discriminated: Decision = normalDecision;
  if (discriminated.action === "ADVANCE_STAGE") {
    assert(discriminated.stage === InterviewStage.Build, "normal continuation should advance to the next stage");
  } else {
    throw new Error("expected ADVANCE_STAGE decision");
  }

  console.log("All decision-engine tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
