import { InMemorySessionStore } from "../src/interview/session-store";
import { InterviewEngine } from "../src/interview/engine";
import { FakeLLMProvider } from "../src/interview/fake-llm-provider";
import { LLMQuestionGenerator, LLMEvaluator } from "../src/interview/llm-adapters";
import { Candidate } from "../src/interview/types";

function assert(cond: boolean, msg?: string) {
  if (!cond) throw new Error(msg || "assertion failed");
}

async function run() {
  const store = new InMemorySessionStore();
  const provider = new FakeLLMProvider();
  const qGen = new LLMQuestionGenerator(provider);
  const evaluator = new LLMEvaluator(provider);
  const engine = new InterviewEngine(store, qGen, evaluator);

  const candidate: Candidate = { id: "cand-llm", displayName: "Test LLM", profile: { projects: ["projA"], skills: ["ts"] } };
  const turn1 = await engine.start(candidate, "llm-session");
  assert(turn1.turnNumber === 1, "first turn number");
  assert(!!turn1.question && turn1.question.id.includes("llm-q"), "first question should be from LLM generator");

  // answer with substantive text to trigger medium evaluation
  const pending = await engine.processAnswer("llm-session", "This is a substantive test answer that is long enough.");
  const state = store.get("llm-session");
  assert(!!state, "state should exist");
  // evidence should have been appended
  assert(state!.evidence.length > 0, "LLM evaluator should produce evidence appended to state");
  // next pending question should exist
  assert(!!pending.question, "processAnswer should return the new pending question");

  console.log("LLM adapter tests passed");
}

run().catch(err => { console.error(err); process.exitCode = 1; });
