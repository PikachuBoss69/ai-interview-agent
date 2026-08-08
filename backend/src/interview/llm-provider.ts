import { GeneratedQuestion, InterviewStage, AnswerEvaluation } from "./types";

export interface PlannerQuestionSummary {
  id: string;
  text?: string;
  targetArea: string;
  curriculumDays: number[];
}

export interface PlannerContext {
  sessionId: string;
  stage: InterviewStage;
  questionCount: number;
  remainingBudget: number;
  askedQuestions: PlannerQuestionSummary[];
  coveredCurriculumDays: number[];
  investigations: Array<{ id: string; targetArea: string; objective?: string; hypothesis?: string }>;
  currentFocus?: { id: string; targetArea: string } | undefined;
  topUncertainties: Array<{ area: string; reason: string; priority: "low" | "medium" | "high" }>;
  candidateProfile?: { id?: string; displayName?: string; projects?: string[]; skills?: string[]; experienceYears?: number };
  decisionHint?: { action?: string; investigation?: { id: string; targetArea: string; objective?: string; hypothesis?: string } };
  instructions?: string;
}

export interface EvaluatorContext {
  sessionId: string;
  question: { id: string; text: string; targetArea: string; curriculumDays: number[] };
  candidateProfile?: { id?: string; displayName?: string; projects?: string[]; skills?: string[]; experienceYears?: number };
  recentStateSummary?: {
    evidenceSummary?: Array<{ topic: string; competencies?: Record<string, string>; confidence?: string; supportingObservations?: string[] }>;
    topUncertainties?: Array<{ area: string; reason: string }>;
  };
  answerText: string;
  instructions?: string;
}

export interface LLMProvider {
  // returns a JSON-like GeneratedQuestion candidate; must be validated by caller
  generateQuestion(context: PlannerContext): Promise<GeneratedQuestion>;
  // returns a JSON-like AnswerEvaluation candidate; must be validated by caller
  evaluateAnswer(context: EvaluatorContext): Promise<AnswerEvaluation>;
}
