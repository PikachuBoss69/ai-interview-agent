import { InMemorySessionStore, SessionStore } from "./session-store";
import {
  Candidate,
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
      id: `${context.state.sessionId}-question-1`,
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
  constructor(
    private readonly store: SessionStore = new InMemorySessionStore(),
    private readonly questionGenerator: QuestionGenerator = new MockQuestionGenerator()
  ) {}

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
}
