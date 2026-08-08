import { LLMProvider, PlannerContext, EvaluatorContext } from "./llm-provider";
import { GeneratedQuestion, AnswerEvaluation } from "./types";

function nowIso() { return new Date().toISOString(); }

export class FakeLLMProvider implements LLMProvider {
  // deterministic generator: use stage and questionCount to pick text
  async generateQuestion(context: PlannerContext): Promise<GeneratedQuestion> {
    const id = `${context.sessionId}-llm-q-${context.questionCount + 1}`;
    const stage = context.stage ?? "Establish";
    const text = `(LLM) ${stage} question: Please describe a ${stage.toLowerCase()} scenario relevant to your experience.`;
    const curriculumDays = context.coveredCurriculumDays && context.coveredCurriculumDays.length ? [Math.max(...context.coveredCurriculumDays) + 1] : [1];
    return {
      id,
      text,
      targetArea: String(stage),
      curriculumDays,
      purpose: "llm-fake",
      difficulty: "medium",
      createdAt: nowIso(),
    } as GeneratedQuestion;
  }

  async evaluateAnswer(context: EvaluatorContext): Promise<AnswerEvaluation> {
    // Simple deterministic evaluator: if answerText length > 20 -> medium evidence, else low
    const text = (context.answerText || "").trim();
    const evaluationId = `${context.question.id}-eval-llm`;
    const now = nowIso();
    if (text.length > 20) {
      return {
        evaluationId,
        evidence: [
          {
            id: `${context.question.id}-evidence-llm-1`,
            questionId: context.question.id,
            topic: context.question.targetArea,
            competencies: {},
            observations: ["Answer contained substantive content."],
            missing: [],
            contradictions: [],
            confidence: "medium",
            createdAt: now,
          },
        ],
        missing: [],
        contradictions: [],
        confidence: "medium",
        evaluatedAt: now,
      };
    }
    return {
      evaluationId,
      evidence: [],
      missing: ["Answer was too short."],
      contradictions: [],
      confidence: "low",
      evaluatedAt: now,
    };
  }
}
