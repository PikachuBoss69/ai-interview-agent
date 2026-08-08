import { DevelopmentAnswerEvaluator, AnswerEvaluator, EvaluationContext } from "./evaluator";
import { DevelopmentDecisionEngine, DecisionEngine, DecisionContext } from "./decision";
import { InMemorySessionStore, SessionStore } from "./session-store";
import {
  Candidate,
  Decision,
  GeneratedQuestion,
  InterviewStage,
  InterviewState,
  InterviewTurn,
  Message,
} from "./types";

export interface QuestionContext {
  candidate: Candidate;
  state: InterviewState;
}

export interface QuestionGenerator {
  generate(context: QuestionContext): Promise<GeneratedQuestion>;
}

export class MockQuestionGenerator implements QuestionGenerator {
  async generate(context: QuestionContext): Promise<GeneratedQuestion> {
    const now = new Date().toISOString();
    return {
      id: `${context.state.sessionId}-question-${context.state.questionCount + 1}`,
      text: `Let's start with an Establish-stage question: ${context.candidate.displayName ? `Candidate ${context.candidate.displayName}` : "Candidate"}, describe a real system you have built or debugged and explain your approach.`,
      targetArea: "Establish",
      curriculumDays: [1],
      purpose: "Establish baseline understanding and invite a concrete example.",
      difficulty: "easy",
      createdAt: now,
    };
  }
}

export class InterviewEngine {
  private readonly store: SessionStore;
  private readonly questionGenerator: QuestionGenerator;
  private readonly answerEvaluator: AnswerEvaluator;
  private readonly decisionEngine: DecisionEngine;

  constructor(
    store?: SessionStore,
    questionGenerator?: QuestionGenerator,
    answerEvaluator?: AnswerEvaluator,
    decisionEngine?: DecisionEngine
  ) {
    this.store = store ?? new InMemorySessionStore();
    this.questionGenerator = questionGenerator ?? new MockQuestionGenerator();
    this.answerEvaluator = answerEvaluator ?? new DevelopmentAnswerEvaluator();
    this.decisionEngine = decisionEngine ?? new DevelopmentDecisionEngine();
  }

  async start(candidate: Candidate, sessionId: string): Promise<InterviewTurn> {
    if (!sessionId || !sessionId.trim()) {
      throw new Error("sessionId must be a non-empty string");
    }

    if (this.store.has(sessionId)) {
      throw new Error(`session with id '${sessionId}' already exists`);
    }

    const now = new Date().toISOString();

    const state: InterviewState = {
      sessionId,
      candidate,
      questionCount: 0,
      stage: InterviewStage.Establish,
      evidence: [],
      uncertainties: [],
      investigations: [],
      coveredTopics: [],
      coveredCurriculumDays: [],
      askedQuestions: [],
      messages: [],
      turns: [],
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const generatedQuestion = await this.questionGenerator.generate({ candidate, state });

    state.askedQuestions = [generatedQuestion.id];
    state.questionCount = 1;
    state.coveredCurriculumDays = this.mergeCurriculumDays([], generatedQuestion.curriculumDays);
    state.messages = [this.createInterviewerMessage(generatedQuestion, now)];
    state.turns = [this.createTurn(1, generatedQuestion, now)];
    state.updatedAt = new Date().toISOString();

    this.store.create(state);

    return {
      turnNumber: 1,
      question: generatedQuestion,
      timestamp: now,
    };
  }

  async processAnswer(sessionId: string, answer: string): Promise<InterviewTurn> {
    if (!sessionId || !sessionId.trim()) {
      throw new Error("sessionId must be a non-empty string");
    }

    const existing = this.store.get(sessionId);
    if (!existing) {
      throw new Error(`session with id '${sessionId}' does not exist`);
    }

    if (existing.status === "completed") {
      throw new Error(`session with id '${sessionId}' is already completed`);
    }

    const currentTurn = [...existing.turns].reverse().find((turn) => !turn.answer);
    if (!currentTurn) {
      throw new Error(`session with id '${sessionId}' has no current question`);
    }

    const currentQuestion = currentTurn.question;
    if (!currentQuestion) {
      throw new Error(`session with id '${sessionId}' has no current question`);
    }

    const candidateAnswer: Message = {
      id: `${sessionId}-message-${existing.messages.length + 1}`,
      role: "candidate",
      content: answer,
      createdAt: new Date().toISOString(),
      questionId: currentQuestion.id,
    };

    const evaluationContext: EvaluationContext = {
      candidate: existing.candidate,
      state: existing,
      question: currentQuestion,
      answer: candidateAnswer,
    };

    const evaluation = await this.answerEvaluator.evaluate(evaluationContext);

    const turnTimestamp = new Date().toISOString();
    existing.evidence = [...existing.evidence, ...evaluation.evidence];
    existing.updatedAt = turnTimestamp;

    const decisionContext: DecisionContext = {
      candidate: existing.candidate,
      state: existing,
      question: currentQuestion,
      answerEvaluation: evaluation,
    };

    const decision = await this.decisionEngine.decide(decisionContext);

    if (decision.action === "FINISH") {
      currentTurn.answer = candidateAnswer;
      currentTurn.evaluation = evaluation;
      currentTurn.decision = decision;
      currentTurn.timestamp = turnTimestamp;
      existing.messages.push(candidateAnswer);
      existing.status = "completed";
      existing.updatedAt = turnTimestamp;
      this.store.update(existing);
      return {
        turnNumber: currentTurn.turnNumber,
        question: currentQuestion,
        answer: candidateAnswer,
        evaluation,
        decision,
        timestamp: turnTimestamp,
      };
    }

    let nextStage = existing.stage;
    if (decision.action === "ADVANCE_STAGE") {
      nextStage = decision.stage;
      existing.stage = nextStage;
    }

    currentTurn.answer = candidateAnswer;
    currentTurn.evaluation = evaluation;
    currentTurn.decision = decision;
    currentTurn.timestamp = turnTimestamp;

    existing.messages.push(candidateAnswer);

    const generatedQuestion = await this.questionGenerator.generate({
      candidate: existing.candidate,
      state: existing,
    });

    if (decision.action === "CONTINUE_INVESTIGATION" || decision.action === "NEW_INVESTIGATION") {
      existing.investigations = [...existing.investigations, decision.investigation];
    }

    existing.askedQuestions = this.mergeUnique(existing.askedQuestions, generatedQuestion.id);
    existing.questionCount += 1;
    existing.coveredCurriculumDays = this.mergeCurriculumDays(existing.coveredCurriculumDays, generatedQuestion.curriculumDays);
    existing.messages.push(this.createInterviewerMessage(generatedQuestion, turnTimestamp));
    const nextTurn = this.createTurn(existing.turns.length + 1, generatedQuestion, turnTimestamp);
    existing.turns.push(nextTurn);
    existing.updatedAt = turnTimestamp;

    this.store.update(existing);

    return {
      turnNumber: nextTurn.turnNumber,
      question: nextTurn.question,
      timestamp: nextTurn.timestamp,
    };
  }

  private createInterviewerMessage(question: GeneratedQuestion, createdAt: string): Message {
    return {
      id: `${question.id}-message`,
      role: "interviewer",
      content: question.text,
      createdAt,
      questionId: question.id,
    };
  }

  private createTurn(turnNumber: number, question: GeneratedQuestion, timestamp: string): InterviewTurn {
    return {
      turnNumber,
      question,
      timestamp,
    };
  }

  private mergeCurriculumDays(existing: number[], incoming: number[]): number[] {
    const merged = new Set(existing);
    incoming.forEach((day) => merged.add(day));
    return Array.from(merged).sort((a, b) => a - b);
  }

  private mergeUnique(existing: string[], incoming: string): string[] {
    return Array.from(new Set([...existing, incoming]));
  }
}
