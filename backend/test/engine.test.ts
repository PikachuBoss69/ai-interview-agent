import { InterviewEngine, MockQuestionGenerator } from "../src/interview/engine";
import { InMemorySessionStore } from "../src/interview/session-store";
import { Candidate, InterviewStage } from "../src/interview/types";

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

  console.log("All engine tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
