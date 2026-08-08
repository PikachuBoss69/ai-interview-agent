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
    coveredCurriculumDays: [1],
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

  const earlyLowCoverageState = makeState({ questionCount: 1, coveredCurriculumDays: [1] });
  const earlyLowCoverageDecision = await engine.decide({
    candidate,
    state: earlyLowCoverageState,
    question,
    answerEvaluation: makeEvaluation("medium", 1),
  });
  assert(earlyLowCoverageDecision.action === "ADVANCE_STAGE", "Q1 with medium confidence should not investigate merely because coverage is low");

  const weakState = makeState({ questionCount: 1, coveredCurriculumDays: [1] });
  const weakDecision = await engine.decide({ candidate, state: weakState, question, answerEvaluation: makeEvaluation("low", 0) });
  assert(weakDecision.action === "CONTINUE_INVESTIGATION", "low-confidence Q1 should trigger investigation");
  assert(weakDecision.action === "CONTINUE_INVESTIGATION" && weakDecision.investigation.targetArea === question.targetArea, "investigation target area should follow the current question");

  const underMinimumState = makeState({ questionCount: 7, coveredCurriculumDays: [1, 2, 3] });
  const underMinimumDecision = await engine.decide({ candidate, state: underMinimumState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(underMinimumDecision.action === "ADVANCE_STAGE", "fewer than 8 questions should advance or explore rather than finish");

  const newInvestigationState = makeState({ questionCount: 7, coveredCurriculumDays: [1, 2, 3, 4] });
  const newInvestigationDecision = await engine.decide({ candidate, state: newInvestigationState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(newInvestigationDecision.action === "NEW_INVESTIGATION", "fewer than 8 questions with sufficient evidence should explore another area");

  const atMinimumState = makeState({ questionCount: 8, coveredCurriculumDays: [1, 2, 3] });
  const atMinimumDecision = await engine.decide({ candidate, state: atMinimumState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(atMinimumDecision.action !== "FINISH", "8 questions with only 3 curriculum days cannot finish");
  assert(atMinimumDecision.action === "NEW_INVESTIGATION", "after the minimum length, insufficient curriculum coverage should continue by exploring another area");

  const strongState = makeState({ questionCount: 8, coveredCurriculumDays: [1, 2, 3, 4] });
  const strongDecision = await engine.decide({ candidate, state: strongState, question, answerEvaluation: makeEvaluation("high", 1) });
  assert(strongDecision.action === "ADVANCE_STAGE", "sufficient evidence after the minimum length should advance stage");

  const maxState = makeState({ questionCount: 12, coveredCurriculumDays: [1, 2] });
  const maxDecision = await engine.decide({ candidate, state: maxState, question, answerEvaluation: makeEvaluation("medium", 1) });
  assert(maxDecision.action === "FINISH", "12 questions must finish even if curriculum coverage is still low");

  const originalStateSnapshot = JSON.stringify(strongState);
  await engine.decide({ candidate, state: strongState, question, answerEvaluation: makeEvaluation("high", 1) });
  assert(JSON.stringify(strongState) === originalStateSnapshot, "decision engine must not mutate interview state");

  const discriminated: Decision = strongDecision;
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
