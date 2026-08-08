import { InterviewEngine, MockQuestionGenerator, QuestionContext, QuestionGenerator } from "../src/interview/engine";
import { DecisionContext, DecisionEngine } from "../src/interview/decision";
import { InMemorySessionStore } from "../src/interview/session-store";
import { Candidate, Decision, GeneratedQuestion, InterviewStage, Investigation, InterviewState } from "../src/interview/types";

function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function assertThrows(fn: () => void | Promise<void>, msg?: string) {
  return Promise.resolve(fn()).then(
    () => {
      throw new Error(msg || "expected function to throw");
    },
    () => undefined
  );
}

class SequenceQuestionGenerator implements QuestionGenerator {
  async generate(context: QuestionContext): Promise<GeneratedQuestion> {
    const index = context.state.questionCount + 1;
    const curriculumDays = index === 1 ? [1] : [2];
    return {
      id: `${context.state.sessionId}-question-${index}`,
      text: index === 1 ? "First question" : "Second question",
      targetArea: index === 1 ? "Establish" : "Build",
      curriculumDays,
      purpose: "test",
      createdAt: new Date().toISOString(),
    };
  }
}

class FailingOnSecondQuestionGenerator implements QuestionGenerator {
  private callCount = 0;

  async generate(context: QuestionContext): Promise<GeneratedQuestion> {
    this.callCount += 1;
    if (this.callCount > 1) {
      throw new Error("question failed");
    }

    return {
      id: `${context.state.sessionId}-question-${context.state.questionCount + 1}`,
      text: "First question",
      targetArea: "Establish",
      curriculumDays: [1],
      purpose: "test",
      createdAt: new Date().toISOString(),
    };
  }
}

class RecordingDecisionEngine implements DecisionEngine {
  public seenStates: InterviewState[] = [];

  async decide(context: DecisionContext): Promise<Decision> {
    this.seenStates.push(JSON.parse(JSON.stringify(context.state)));
    const investigation: Investigation = {
      id: `investigation-${context.state.questionCount + 1}`,
      objective: "Collect more evidence about the candidate's technical reasoning.",
      hypothesis: "Current evidence is insufficient to determine depth.",
      targetArea: context.question.targetArea,
      priority: "medium",
      createdAt: new Date().toISOString(),
    };
    return {
      action: "CONTINUE_INVESTIGATION",
      investigation,
    };
  }
}

class AdvancingStageDecisionEngine implements DecisionEngine {
  async decide(context: DecisionContext): Promise<Decision> {
    const stageOrder = [
      InterviewStage.Establish,
      InterviewStage.Build,
      InterviewStage.Extend,
      InterviewStage.Break,
      InterviewStage.Disambiguate,
      InterviewStage.Optimize,
      InterviewStage.Operate,
      InterviewStage.Synthesize,
    ];
    const stageIndex = Math.min(context.state.questionCount, stageOrder.length - 1);
    return {
      action: "ADVANCE_STAGE",
      stage: stageOrder[stageIndex],
    };
  }
}

async function run() {
  const store = new InMemorySessionStore();
  const engine = new InterviewEngine(store, new MockQuestionGenerator());
  const candidate: Candidate = {
    id: "cand-001",
    displayName: "Ada",
    profile: { experience: "2 years" },
  };

  const turn = await engine.start(candidate, "session-1");
  assert(turn.turnNumber === 1, "first turn should be turn 1");
  assert(!!turn.question, "turn should include a generated question");
  assert(turn.question?.targetArea === "Establish", "first question should target Establish");
  assert(turn.question?.text.includes("real system") ?? false, "first question should be an Establish-stage question");
  assert((turn.question?.curriculumDays?.length ?? 0) > 0, "generated question should carry curriculum day metadata");

  const persisted = store.get("session-1");
  assert(!!persisted, "session should be stored");
  assert(persisted!.sessionId === "session-1", "persisted session ID should match");
  assert(persisted!.stage === InterviewStage.Establish, "initial stage should be Establish");
  assert(persisted!.questionCount === 1, "initial question count should be 1 after first question is asked");
  assert(persisted!.askedQuestions.includes(turn.question!.id), "generated question should be recorded in askedQuestions");
  assert(persisted!.messages.length === 1, "interviewer message should be recorded");
  assert(persisted!.messages[0].role === "interviewer", "recorded message should be from interviewer");
  assert(persisted!.turns.length === 1, "a turn should be recorded in state");
  assert(turn.question!.curriculumDays.length > 0, "generated question should carry curriculum day metadata");
  assert(
    JSON.stringify(persisted!.coveredCurriculumDays) === JSON.stringify(turn.question!.curriculumDays),
    "persisted state should mirror the generated question curriculum days"
  );
  assert(
    new Set(persisted!.coveredCurriculumDays).size === persisted!.coveredCurriculumDays.length,
    "curriculum day coverage should not contain duplicates"
  );

  await assertThrows(async () => {
    await engine.start(candidate, "session-1");
  }, "duplicate session should throw");

  await assertThrows(async () => {
    await engine.start(candidate, "   ");
  }, "invalid sessionId should throw");

  const generatorSequenceStore = new InMemorySessionStore();
  const generatorSequenceEngine = new InterviewEngine(generatorSequenceStore, new MockQuestionGenerator(), undefined, new AdvancingStageDecisionEngine());
  await generatorSequenceEngine.start(candidate, "generator-sequence-session");
  const firstGeneratedTurn = await generatorSequenceEngine.processAnswer("generator-sequence-session", "I can explain my approach clearly.");
  const secondGeneratedTurn = await generatorSequenceEngine.processAnswer("generator-sequence-session", "I can explain my approach differently.");
  const generatorSequenceState = generatorSequenceStore.get("generator-sequence-session");
  assert(!!generatorSequenceState, "generator sequence session should be persisted");
  assert(firstGeneratedTurn.question?.text !== turn.question?.text, "subsequent questions should not all have identical text");
  assert(secondGeneratedTurn.question?.text !== firstGeneratedTurn.question?.text, "generated questions should vary across turns");
  assert(new Set(generatorSequenceState!.askedQuestions).size === generatorSequenceState!.askedQuestions.length, "generated question IDs should be unique");
  assert(generatorSequenceState!.askedQuestions.every((questionId) => questionId.includes("generator-sequence-session-question")), "generated question IDs should be derived from the session");
  assert((generatorSequenceState!.turns[1].question?.curriculumDays?.length ?? 0) > 0, "subsequent questions should carry curriculum metadata");
  assert(generatorSequenceState!.turns[1].question?.targetArea === InterviewStage.Build, "advancing stage should produce a stage-appropriate question");
  assert(generatorSequenceState!.turns[2].question?.targetArea === InterviewStage.Extend, "later turns should continue to produce stage-appropriate questions");

  const sequenceStore = new InMemorySessionStore();
  const sequenceEngine = new InterviewEngine(sequenceStore, new SequenceQuestionGenerator());
  await sequenceEngine.start(candidate, "sequence-session");
  const answerTurn = await sequenceEngine.processAnswer("sequence-session", "I can explain my approach clearly.");
  assert(answerTurn.turnNumber === 2, "continuation should return the new pending turn");
  assert(answerTurn.question?.id === "sequence-session-question-2", "continuation should return the next question and not the previous one");
  assert(answerTurn.answer === undefined, "continuation return should not include the candidate answer");

  const sequenceState = sequenceStore.get("sequence-session");
  assert(!!sequenceState, "sequence session should be persisted");
  assert(sequenceState!.messages.length === 3, "messages should include the candidate answer and next interviewer prompt");
  assert(sequenceState!.messages[1].role === "candidate", "candidate answer should be stored in messages");
  assert(sequenceState!.evidence.length > 0, "evaluation evidence should accumulate");
  assert(sequenceState!.questionCount === 2, "question count should increase when a new question is generated");
  assert(JSON.stringify(sequenceState!.coveredCurriculumDays) === JSON.stringify([1, 2]), "curriculum coverage should accumulate without duplicates");
  assert(sequenceState!.turns.length === 2, "completed answer turn and pending next question turn should be recorded");
  assert(sequenceState!.turns[0].answer?.content === "I can explain my approach clearly.", "Q1 should be completed in state.turns");
  assert(sequenceState!.turns[0].evaluation !== undefined, "Q1 should receive an evaluation in state.turns");
  assert(sequenceState!.turns[0].decision !== undefined, "Q1 should receive a decision in state.turns");
  assert(sequenceState!.turns[1].answer === undefined, "Q2 should remain pending without an answer");
  assert(sequenceState!.turns[1].evaluation === undefined, "Q2 should not have an evaluation yet");
  assert(sequenceState!.turns[1].decision === undefined, "Q2 should not have a decision yet");

  const investigationStore = new InMemorySessionStore();
  const investigationEngine = new InterviewEngine(investigationStore, new MockQuestionGenerator(), undefined, new RecordingDecisionEngine());
  await investigationEngine.start(candidate, "investigation-session");
  await investigationEngine.processAnswer("investigation-session", "I can explain my approach clearly.");
  const investigationState = investigationStore.get("investigation-session");
  assert(!!investigationState, "investigation session should be persisted");
  assert(investigationState!.investigations.length === 1, "continue-investigation should create an investigation entry");
  assert(investigationState!.investigations[0].targetArea === InterviewStage.Establish, "investigation target area should be preserved");
  assert(investigationState!.turns[1].question?.targetArea === InterviewStage.Establish, "continue-investigation should keep the next question relevant to the investigation target area");

  const decisionStateStore = new InMemorySessionStore();
  const decisionStateEngine = new InterviewEngine(decisionStateStore, new SequenceQuestionGenerator());
  await decisionStateEngine.start(candidate, "decision-state-session");
  const recordingDecisionEngine = new RecordingDecisionEngine();
  const recordingEngine = new InterviewEngine(
    decisionStateStore,
    new SequenceQuestionGenerator(),
    undefined,
    recordingDecisionEngine
  );
  const decisionState = decisionStateStore.get("decision-state-session");
  if (decisionState) {
    decisionState.investigations = [{
      id: "existing-investigation",
      objective: "Existing investigation",
      hypothesis: "existing",
      targetArea: "Establish",
      createdAt: new Date().toISOString(),
    }];
    decisionStateStore.update(decisionState);
  }
  await recordingEngine.processAnswer("decision-state-session", "I can explain my approach clearly.");
  const recordedState = recordingDecisionEngine.seenStates[0];
  assert(!!recordedState, "decision engine should receive a state");
  assert(recordedState.evidence.length > 0, "decision engine should receive evidence from the current answer");
  const persistedDecisionState = decisionStateStore.get("decision-state-session");
  assert(!!persistedDecisionState, "decision-state session should be persisted");
  assert(persistedDecisionState!.investigations.length === 2, "investigations from the decision engine should be persisted");
  assert(persistedDecisionState!.investigations[0].id === "existing-investigation", "previous investigations should be preserved");
  assert(persistedDecisionState!.investigations[1].targetArea === "Establish", "persisted investigation should be stored");

  const completedStore = new InMemorySessionStore();
  const completedEngine = new InterviewEngine(completedStore, new SequenceQuestionGenerator());
  await completedEngine.start(candidate, "complete-session");
  const completedState = completedStore.get("complete-session");
  if (completedState) {
    completedState.questionCount = 12;
    completedState.coveredCurriculumDays = [1, 2, 3, 4];
    completedStore.update(completedState);
  }
  const completedAnswer = await completedEngine.processAnswer("complete-session", "I can explain my approach clearly.");
  const completedStateAfter = completedStore.get("complete-session");
  assert(!!completedAnswer.decision, "completed answer should include a decision");
  assert(completedAnswer.decision!.action === "FINISH", "12-question limit should finish the interview");
  assert(!!completedAnswer.question, "finished turn should include the completed question");
  assert(completedAnswer.answer?.content === "I can explain my approach clearly.", "finish should return the completed turn");
  assert(!!completedStateAfter, "completed session should remain persisted");
  assert(completedStateAfter!.status === "completed", "completed session should be marked completed");
  assert(completedStateAfter!.turns.length === 1, "finish should not create a new pending turn");

  const missingStore = new InMemorySessionStore();
  const missingEngine = new InterviewEngine(missingStore, new SequenceQuestionGenerator());
  await assertThrows(async () => {
    await missingEngine.processAnswer("missing-session", "answer");
  }, "nonexistent session should throw");

  const completedSessionStore = new InMemorySessionStore();
  const completedSessionEngine = new InterviewEngine(completedSessionStore, new SequenceQuestionGenerator());
  await completedSessionEngine.start(candidate, "closed-session");
  const closedState = completedSessionStore.get("closed-session");
  if (closedState) {
    closedState.status = "completed";
    completedSessionStore.update(closedState);
  }
  await assertThrows(async () => {
    await completedSessionEngine.processAnswer("closed-session", "answer");
  }, "completed session should throw");

  const evaluatorFailureStore = new InMemorySessionStore();
  const evaluatorFailureEngine = new InterviewEngine(
    evaluatorFailureStore,
    new SequenceQuestionGenerator(),
    {
      async evaluate() {
        throw new Error("evaluator failed");
      },
    }
  );
  await evaluatorFailureEngine.start(candidate, "evaluator-fail");
  await assertThrows(async () => {
    await evaluatorFailureEngine.processAnswer("evaluator-fail", "answer");
  }, "evaluator failure should not crash the engine");
  const evaluatorFailureState = evaluatorFailureStore.get("evaluator-fail");
  assert(!!evaluatorFailureState, "state should remain available after evaluator failure");
  assert(evaluatorFailureState!.messages.length === 1, "evaluator failure should not add a candidate answer message");

  const decisionFailureStore = new InMemorySessionStore();
  const decisionFailureEngine = new InterviewEngine(
    decisionFailureStore,
    new SequenceQuestionGenerator(),
    undefined,
    {
      async decide() {
        throw new Error("decision failed");
      },
    }
  );
  await decisionFailureEngine.start(candidate, "decision-fail");
  await assertThrows(async () => {
    await decisionFailureEngine.processAnswer("decision-fail", "answer");
  }, "decision failure should not crash the engine");
  const decisionFailureState = decisionFailureStore.get("decision-fail");
  assert(!!decisionFailureState, "decision failure should leave the state intact");
  assert(decisionFailureState!.messages.length === 1, "decision failure should not add a new question message");

  const questionFailureStore = new InMemorySessionStore();
  const questionFailureEngine = new InterviewEngine(
    questionFailureStore,
    new FailingOnSecondQuestionGenerator(),
    undefined,
    undefined
  );
  await questionFailureEngine.start(candidate, "question-fail");
  await assertThrows(async () => {
    await questionFailureEngine.processAnswer("question-fail", "answer");
  }, "question generation failure should not crash the engine");
  const questionFailureState = questionFailureStore.get("question-fail");
  assert(!!questionFailureState, "question failure should leave the state intact");
  assert(questionFailureState!.messages.length === 1, "question failure should not add a new interviewer message");

  console.log("All engine tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
