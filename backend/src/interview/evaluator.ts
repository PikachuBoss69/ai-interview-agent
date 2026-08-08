import { AnswerEvaluation, Candidate, Evidence, GeneratedQuestion, InterviewState, Message } from "./types";

export interface EvaluationContext {
  candidate: Candidate;
  state: InterviewState;
  question: GeneratedQuestion;
  answer: Message;
}

export interface AnswerEvaluator {
  evaluate(context: EvaluationContext): Promise<AnswerEvaluation>;
}

export class DevelopmentAnswerEvaluator implements AnswerEvaluator {
  async evaluate(context: EvaluationContext): Promise<AnswerEvaluation> {
    const text = context.answer.content.trim();
    const now = new Date().toISOString();

    if (!text) {
      return {
        evaluationId: `${context.question.id}-evaluation-empty`,
        evidence: [],
        missing: ["A candidate answer was not provided."],
        contradictions: [],
        confidence: "low",
        evaluatedAt: now,
      };
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount < 6) {
      return {
        evaluationId: `${context.question.id}-evaluation-short`,
        evidence: [
          {
            id: `${context.question.id}-evidence-short`,
            questionId: context.question.id,
            topic: context.question.targetArea,
            competencies: {},
            observations: ["Answer was very short and did not provide much detail."],
            missing: ["Insufficient detail was provided to make a substantive assessment."],
            contradictions: [],
            confidence: "low",
            createdAt: now,
          },
        ],
        missing: ["Insufficient detail was provided to make a substantive assessment."],
        contradictions: [],
        confidence: "low",
        evaluatedAt: now,
      };
    }

    const evidence: Evidence[] = [
      {
        id: `${context.question.id}-evidence-generic`,
        questionId: context.question.id,
        topic: context.question.targetArea,
        competencies: {},
        observations: ["The candidate provided a substantive response."],
        missing: [],
        contradictions: [],
        confidence: "medium",
        createdAt: now,
      },
    ];

    return {
      evaluationId: `${context.question.id}-evaluation`,
      evidence,
      missing: [],
      contradictions: [],
      confidence: "medium",
      evaluatedAt: now,
    };
  }
}
