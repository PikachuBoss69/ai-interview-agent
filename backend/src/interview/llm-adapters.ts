import { LLMProvider, PlannerContext, EvaluatorContext } from "./llm-provider";
import { QuestionGenerator, QuestionContext } from "./engine";
import { AnswerEvaluator, EvaluationContext } from "./evaluator";
import { GeneratedQuestion, AnswerEvaluation, Evidence } from "./types";

function nowIso() { return new Date().toISOString(); }

export class LLMQuestionGenerator implements QuestionGenerator {
  constructor(private provider: LLMProvider) {}

  async generate(context: QuestionContext): Promise<GeneratedQuestion> {
    const planner: PlannerContext = {
      sessionId: context.state.sessionId,
      stage: context.state.stage,
      questionCount: context.state.questionCount,
      remainingBudget: Math.max(0, 12 - context.state.questionCount),
      askedQuestions: (context.state.askedQuestions || []).map((id) => ({ id, targetArea: "" as any, curriculumDays: [] })),
      coveredCurriculumDays: context.state.coveredCurriculumDays || [],
      investigations: (context.state.investigations || []).map((i) => ({ id: i.id, targetArea: i.targetArea, objective: i.objective, hypothesis: i.hypothesis })),
      currentFocus: context.state.currentFocus ? { id: context.state.currentFocus.id, targetArea: context.state.currentFocus.targetArea } : undefined,
      topUncertainties: (context.state.uncertainties || []).slice(0,3).map(u => ({ area: u.area, reason: u.reason, priority: u.priority })),
      candidateProfile: sanitizeProfile(context.candidate),
      decisionHint: undefined,
      instructions: "Return a JSON object for GeneratedQuestion. Keep text concise."
    };

    const q = await this.provider.generateQuestion(planner);
    // basic validation and normalization
    if (!q || typeof q.id !== "string" || typeof q.text !== "string") {
      throw new Error("LLMQuestionGenerator: invalid question from provider");
    }
    // ensure required fields
    return {
      id: q.id,
      text: q.text,
      targetArea: q.targetArea ?? String(context.state.stage),
      curriculumDays: Array.isArray(q.curriculumDays) ? q.curriculumDays : [],
      purpose: q.purpose ?? "llm-generated",
      difficulty: q.difficulty ?? "medium",
      createdAt: nowIso(),
    } as GeneratedQuestion;
  }
}

export class LLMEvaluator implements AnswerEvaluator {
  constructor(private provider: LLMProvider) {}

  async evaluate(context: EvaluationContext): Promise<AnswerEvaluation> {
    const evalCtx: EvaluatorContext = {
      sessionId: context.state.sessionId,
      question: { id: context.question.id, text: context.question.text, targetArea: context.question.targetArea, curriculumDays: context.question.curriculumDays },
      candidateProfile: sanitizeProfile(context.candidate),
      recentStateSummary: { evidenceSummary: (context.state.evidence || []).slice(-5).map(e => ({ topic: e.topic, competencies: e.competencies as any, confidence: e.confidence, supportingObservations: e.observations?.slice(0,2) })) },
      answerText: context.answer.content,
      instructions: "Return a JSON object matching AnswerEvaluation schema."
    };

    const evaluation = await this.provider.evaluateAnswer(evalCtx);
    // basic validation
    if (!evaluation || typeof evaluation.evaluationId !== "string" || !Array.isArray(evaluation.evidence) || typeof evaluation.confidence !== "string") {
      throw new Error("LLMEvaluator: invalid evaluation from provider");
    }

    // ensure evidence items have questionId set
    const normalizedEvidence: Evidence[] = evaluation.evidence.map((ev: any, idx: number) => ({
      id: ev.id ?? `${context.question.id}-evidence-${idx}`,
      questionId: ev.questionId ?? context.question.id,
      topic: ev.topic ?? context.question.targetArea,
      competencies: ev.competencies ?? {},
      observations: ev.observations ?? [],
      missing: ev.missing ?? [],
      contradictions: ev.contradictions ?? [],
      confidence: ev.confidence ?? evaluation.confidence ?? "low",
      createdAt: ev.createdAt ?? nowIso(),
    }));

    return {
      evaluationId: evaluation.evaluationId,
      evidence: normalizedEvidence,
      missing: evaluation.missing ?? [],
      contradictions: evaluation.contradictions ?? [],
      confidence: evaluation.confidence as any,
      evaluatedAt: evaluation.evaluatedAt ?? nowIso(),
    } as AnswerEvaluation;
  }
}

function sanitizeProfile(candidate: any) {
  if (!candidate || typeof candidate !== 'object') return undefined;
  const profile = candidate.profile ?? {};
  const allowed: any = {};
  if (candidate.id) allowed.id = candidate.id;
  if (candidate.displayName) allowed.displayName = candidate.displayName;
  if (Array.isArray(profile.projects)) allowed.projects = profile.projects.slice(0,5).map(String);
  if (Array.isArray(profile.skills)) allowed.skills = profile.skills.slice(0,10).map(String);
  if (typeof profile.experienceYears === 'number') allowed.experienceYears = profile.experienceYears;
  return allowed;
}
